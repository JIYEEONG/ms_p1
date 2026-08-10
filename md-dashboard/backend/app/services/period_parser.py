# app/services/period_parser.py
"""
정책 06 리포트 - 기간 파싱 모듈 (전면 재작성)

사용자 확정 규칙:
  - 일(daily):     00:00:00 ~ 23:59:59 (하루)
  - 주(weekly):    월요일 ~ 일요일. 표시 라벨은 그 주의 월요일 날짜 기준
                   "n월 n일 주" (예: 8월 7일이 월요일이면 "8월 7일 주")
  - 월(monthly):   해당월 1일 ~ 말일
  - 분기(quarterly): Q1=1/1~3/31, Q2=4/1~6/30, Q3=7/1~9/30, Q4=10/1~12/31 (달력 고정)
  - 년(yearly):    1/1 ~ 12/31

핵심 원칙:
  1. 기간 계산은 LLM에게 맡기지 않고 datetime으로 결정적으로 계산한다.
  2. 프롬프트에서 기간을 못 찾으면(모호) -> was_ambiguous=True 반환.
     -> 호출부(rag_service.py)가 이걸 보고 리포트를 만들지 않고 "정확한 기간을 알려달라"고
        되묻는다 (요청하신 "모호하면 정확한 기간값 요구하기" 그대로).
  3. 이 모듈은 기간 "표현"만 파싱한다. 그 기간이 실제 DB 데이터 범위 안에 있는지는
     별도로 rag_service.py에서 data_loader의 실제 데이터 범위와 대조해서 판단한다
     (파싱 자체는 성공했어도 "그 기간엔 데이터가 없다"는 별개의 문제이므로 분리).
"""

import re
from dataclasses import dataclass, asdict
from datetime import date, datetime, timedelta


@dataclass
class PeriodResult:
    period_type: str          # daily / weekly / monthly / quarterly / yearly
    start_date: str            # YYYY-MM-DD
    end_date: str               # YYYY-MM-DD
    start_datetime: str         # YYYY-MM-DD 00:00:00 (SQL BETWEEN용, 시분초 포함)
    end_datetime: str           # YYYY-MM-DD 23:59:59
    compare_start: str
    compare_end: str
    compare_label: str          # "전일" / "전주" / "전월" / "전분기" / "전년도"
    display_label: str          # 화면 상단에 그대로 노출할 라벨 (규칙 그대로 반영)
    was_ambiguous: bool         # 기간을 특정할 수 없어 되물어야 하는 상태인지

    def to_dict(self):
        return asdict(self)


def _week_range(anchor: date) -> tuple[date, date]:
    monday = anchor - timedelta(days=anchor.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _month_range(year: int, month: int) -> tuple[date, date]:
    start = date(year, month, 1)
    end = date(year, 12, 31) if month == 12 else date(year, month + 1, 1) - timedelta(days=1)
    return start, end


def _quarter_range(year: int, q: int) -> tuple[date, date]:
    start_month = (q - 1) * 3 + 1
    start = date(year, start_month, 1)
    end = _month_range(year, start_month + 2)[1]
    return start, end


def _prev_month(year: int, month: int) -> tuple[int, int]:
    return (year - 1, 12) if month == 1 else (year, month - 1)


def _prev_quarter(year: int, q: int) -> tuple[int, int]:
    return (year - 1, 4) if q == 1 else (year, q - 1)


def _dt_range(start: date, end: date) -> tuple[str, str]:
    """00:00:00 ~ 23:59:59 문자열로 변환 (일 단위 경계 규칙 공통 적용)"""
    return f"{start.isoformat()} 00:00:00", f"{end.isoformat()} 23:59:59"


# --- 패턴 정의 ---

_DAY_PATTERNS = [
    (re.compile(r"오늘"), 0),
    (re.compile(r"어제"), -1),
    (re.compile(r"그제|그저께"), -2),
]

_EXPLICIT_YEAR = re.compile(
    r"(?:(\d{2,4}))\s*년"
)

_EXPLICIT_DATE = re.compile(
    r"(?:(\d{2,4})년\s*)?(\d{1,2})월\s*(\d{1,2})일"
)

_QUARTER_KEYWORD = re.compile(
    r"([1-4])\s*분기|Q([1-4])",
    re.IGNORECASE
)

_MONTH_KEYWORD = re.compile(
    r"(\d{1,2})\s*월(?!\s*\d{1,2}\s*일)"
)

_RELATIVE_MONTH = re.compile(
    r"(이번\s*달|지난\s*달|저번\s*달)"
)


# ============================================================
# 주간 관련 패턴
# ============================================================

_WEEK_PATTERNS = [
    (re.compile(r"(이번\s*주|금주)"), 0),
    (re.compile(r"(저번\s*주|지난\s*주|전주)"), -1),
]


# "8월 7일 주", "25년 8월 7일 주"
# → 해당 날짜가 포함된 월~일 주간
_EXPLICIT_WEEK_DATE = re.compile(
    r"(?:(\d{2,4})년\s*)?"
    r"(\d{1,2})월\s*"
    r"(\d{1,2})일\s*주"
)


# "8월 둘째주", "8월 둘째 주"
# "25년 8월 둘째주"
_MONTH_WEEK_KOREAN = re.compile(
    r"(?:(\d{2,4})년\s*)?"
    r"(\d{1,2})월\s*"
    r"(첫째|첫|둘째|둘|셋째|셋|넷째|넷|다섯째|다섯)"
    r"\s*주"
)


# "8월 2주", "25년 8월 2주"
_MONTH_WEEK_NUMBER = re.compile(
    r"(?:(\d{2,4})년\s*)?"
    r"(\d{1,2})월\s*"
    r"([1-5])\s*주"
)


_YEARLY_KEYWORD = re.compile(
    r"연간|올해|작년"
)


def _normalize_year(y: int) -> int:
    """'25년' -> 2025년 (2자리면 2000년대로 간주)"""
    return 2000 + y if y < 100 else y

def _week_number_from_korean(value: str) -> int:
    """첫째/둘째/셋째... -> 1/2/3..."""
    mapping = {
        "첫째": 1,
        "첫": 1,
        "둘째": 2,
        "둘": 2,
        "셋째": 3,
        "셋": 3,
        "넷째": 4,
        "넷": 4,
        "다섯째": 5,
        "다섯": 5,
    }
    return mapping[value]


def _month_week_range(
    year: int,
    month: int,
    week_number: int,
) -> tuple[date, date]:
    """
    해당 월의 N번째 주를 월요일~일요일 기준으로 계산한다.
    "n주"는 항상 7일(월~일)이며, 월 경계를 넘어가도 자르지 않는다.

    예:
        2025년 8월 (8/1이 금요일)
        1주 -> 7/28(월)~8/3(일)  ← 월 경계를 넘어가지만 그대로 7일 유지
        2주 -> 8/4~8/10
        3주 -> 8/11~8/17
        4주 -> 8/18~8/24
        5주 -> 8/25~8/31
    """

    month_start, _ = _month_range(year, month)

    # 해당 월 1일이 속한 월~일 주간의 월요일
    first_monday = month_start - timedelta(days=month_start.weekday())

    start = first_monday + timedelta(days=(week_number - 1) * 7)
    end = start + timedelta(days=6)

    return start, end


def parse_period(
    user_prompt: str,
    today: date | None = None
) -> PeriodResult:

    if today is None:
        today = date.today()

    raw = user_prompt
    text_nospace = raw.replace(" ", "")

    # ============================================================
    # 0) 주간 - 명시적 날짜 + "주"
    #    예:
    #      "8월 7일 주"
    #      "25년 8월 7일 주"
    #
    # 반드시 명시적 날짜(daily)보다 먼저 처리해야 함.
    # ============================================================

    m = _EXPLICIT_WEEK_DATE.search(raw)

    if m:
        year = (
            _normalize_year(int(m.group(1)))
            if m.group(1)
            else today.year
        )

        month = int(m.group(2))
        day = int(m.group(3))

        try:
            anchor = date(year, month, day)
        except ValueError:
            anchor = None

        if anchor:
            start, end = _week_range(anchor)

            cstart = start - timedelta(days=7)
            cend = end - timedelta(days=7)

            s_dt, e_dt = _dt_range(start, end)

            return PeriodResult(
                period_type="weekly",
                start_date=start.isoformat(),
                end_date=end.isoformat(),
                start_datetime=s_dt,
                end_datetime=e_dt,
                compare_start=cstart.isoformat(),
                compare_end=cend.isoformat(),
                compare_label="전주",
                display_label=(
                    f"{start.month}월 {start.day}일 주 "
                    f"({start.isoformat()}~{end.isoformat()})"
                ),
                was_ambiguous=False,
            )


    # ============================================================
    # 0-1) 주간 - "8월 둘째주"
    #      "25년 8월 둘째주"
    # ============================================================

    m = _MONTH_WEEK_KOREAN.search(raw)

    if m:
        year = (
            _normalize_year(int(m.group(1)))
            if m.group(1)
            else today.year
        )

        month = int(m.group(2))
        week_number = _week_number_from_korean(m.group(3))

        if 1 <= month <= 12:
            start, end = _month_week_range(
                year,
                month,
                week_number,
            )

            cstart = start - timedelta(days=7)
            cend = end - timedelta(days=7)

            s_dt, e_dt = _dt_range(start, end)

            return PeriodResult(
                period_type="weekly",
                start_date=start.isoformat(),
                end_date=end.isoformat(),
                start_datetime=s_dt,
                end_datetime=e_dt,
                compare_start=cstart.isoformat(),
                compare_end=cend.isoformat(),
                compare_label="전주",
                display_label=(
                    f"{start.month}월 {start.day}일 주 "
                    f"({start.isoformat()}~{end.isoformat()})"
                ),
                was_ambiguous=False,
            )


    # ============================================================
    # 0-2) 주간 - "8월 2주"
    #      "25년 8월 2주"
    # ============================================================

    m = _MONTH_WEEK_NUMBER.search(raw)

    if m:
        year = (
            _normalize_year(int(m.group(1)))
            if m.group(1)
            else today.year
        )

        month = int(m.group(2))
        week_number = int(m.group(3))

        if 1 <= month <= 12:
            start, end = _month_week_range(
                year,
                month,
                week_number,
            )

            cstart = start - timedelta(days=7)
            cend = end - timedelta(days=7)

            s_dt, e_dt = _dt_range(start, end)

            return PeriodResult(
                period_type="weekly",
                start_date=start.isoformat(),
                end_date=end.isoformat(),
                start_datetime=s_dt,
                end_datetime=e_dt,
                compare_start=cstart.isoformat(),
                compare_end=cend.isoformat(),
                compare_label="전주",
                display_label=(
                    f"{start.month}월 {start.day}일 주 "
                    f"({start.isoformat()}~{end.isoformat()})"
                ),
                was_ambiguous=False,
            )


    # ============================================================
    # 1) 명시적 날짜
    #    "8월 5일"
    #    "25년 8월 5일"
    #
    # 위의 "8월 5일 주"와 반드시 분리해서 처리
    # ============================================================

    m = _EXPLICIT_DATE.search(raw)

    if m:
        year = (
            _normalize_year(int(m.group(1)))
            if m.group(1)
            else today.year
        )

        month, day = int(m.group(2)), int(m.group(3))

        try:
            target = date(year, month, day)
        except ValueError:
            target = None

        if target:
            prior = target - timedelta(days=1)

            s_dt, e_dt = _dt_range(target, target)
            ps_dt, pe_dt = _dt_range(prior, prior)

            return PeriodResult(
                period_type="daily",
                start_date=target.isoformat(),
                end_date=target.isoformat(),
                start_datetime=s_dt,
                end_datetime=e_dt,
                compare_start=prior.isoformat(),
                compare_end=prior.isoformat(),
                compare_label="전일",
                display_label=(
                    f"{target.year}년 "
                    f"{target.month}월 "
                    f"{target.day}일 "
                    f"(00:00~23:59)"
                ),
                was_ambiguous=False,
            )


    # ============================================================
    # 2) 상대 일자
    # ============================================================

    for pattern, offset in _DAY_PATTERNS:

        if pattern.search(raw):

            target = today + timedelta(days=offset)
            prior = target - timedelta(days=1)

            s_dt, e_dt = _dt_range(target, target)
            ps_dt, pe_dt = _dt_range(prior, prior)

            return PeriodResult(
                period_type="daily",
                start_date=target.isoformat(),
                end_date=target.isoformat(),
                start_datetime=s_dt,
                end_datetime=e_dt,
                compare_start=prior.isoformat(),
                compare_end=prior.isoformat(),
                compare_label="전일",
                display_label=(
                    f"{target.year}년 "
                    f"{target.month}월 "
                    f"{target.day}일 "
                    f"(00:00~23:59)"
                ),
                was_ambiguous=False,
            )


    # ============================================================
    # 3) 분기
    # ============================================================

    m = _QUARTER_KEYWORD.search(raw)

    if m:

        q = int(m.group(1) or m.group(2))

        year_m = _EXPLICIT_YEAR.search(raw)

        year = (
            _normalize_year(int(year_m.group(1)))
            if year_m
            else today.year
        )

        start, end = _quarter_range(year, q)

        py, pq = _prev_quarter(year, q)
        cstart, cend = _quarter_range(py, pq)

        s_dt, e_dt = _dt_range(start, end)

        return PeriodResult(
            period_type="quarterly",
            start_date=start.isoformat(),
            end_date=end.isoformat(),
            start_datetime=s_dt,
            end_datetime=e_dt,
            compare_start=cstart.isoformat(),
            compare_end=cend.isoformat(),
            compare_label="전분기",
            display_label=(
                f"{year}년 {q}분기 "
                f"(Q{q}, {start.isoformat()}~{end.isoformat()})"
            ),
            was_ambiguous=False,
        )


    # ============================================================
    # 4) 연간
    # ============================================================

    if _YEARLY_KEYWORD.search(raw):

        year_m = _EXPLICIT_YEAR.search(raw)

        if year_m:
            year = _normalize_year(int(year_m.group(1)))
        elif "작년" in raw:
            year = today.year - 1
        else:
            year = today.year

        start = date(year, 1, 1)
        end = date(year, 12, 31)

        s_dt, e_dt = _dt_range(start, end)

        return PeriodResult(
            period_type="yearly",
            start_date=start.isoformat(),
            end_date=end.isoformat(),
            start_datetime=s_dt,
            end_datetime=e_dt,
            compare_start=f"{year - 1}-01-01",
            compare_end=f"{year - 1}-12-31",
            compare_label="전년도",
            display_label=(
                f"{year}년 "
                f"({start.isoformat()}~{end.isoformat()})"
            ),
            was_ambiguous=False,
        )


    # ============================================================
    # 5) 월간
    # ============================================================

    rel_m = _RELATIVE_MONTH.search(text_nospace)
    month_m = _MONTH_KEYWORD.search(raw)

    if rel_m or month_m:

        if rel_m:

            if (
                "지난" in rel_m.group(1)
                or "저번" in rel_m.group(1)
            ):
                year, month = _prev_month(
                    today.year,
                    today.month,
                )
            else:
                year, month = today.year, today.month

        else:

            month = int(month_m.group(1))

            year_m = _EXPLICIT_YEAR.search(raw)

            year = (
                _normalize_year(int(year_m.group(1)))
                if year_m
                else today.year
            )

        if not (1 <= month <= 12):
            month = None

        if month:

            start, end = _month_range(year, month)

            py, pm = _prev_month(year, month)
            cstart, cend = _month_range(py, pm)

            s_dt, e_dt = _dt_range(start, end)

            return PeriodResult(
                period_type="monthly",
                start_date=start.isoformat(),
                end_date=end.isoformat(),
                start_datetime=s_dt,
                end_datetime=e_dt,
                compare_start=cstart.isoformat(),
                compare_end=cend.isoformat(),
                compare_label="전월",
                display_label=(
                    f"{year}년 {month}월 "
                    f"({start.isoformat()}~{end.isoformat()})"
                ),
                was_ambiguous=False,
            )


    # ============================================================
    # 6) 상대 주간
    # ============================================================

    for pattern, offset in _WEEK_PATTERNS:

        if pattern.search(raw):

            anchor = today + timedelta(weeks=offset)

            start, end = _week_range(anchor)

            cstart = start - timedelta(days=7)
            cend = end - timedelta(days=7)

            s_dt, e_dt = _dt_range(start, end)

            return PeriodResult(
                period_type="weekly",
                start_date=start.isoformat(),
                end_date=end.isoformat(),
                start_datetime=s_dt,
                end_datetime=e_dt,
                compare_start=cstart.isoformat(),
                compare_end=cend.isoformat(),
                compare_label="전주",
                display_label=(
                    f"{start.month}월 {start.day}일 주 "
                    f"({start.isoformat()}~{end.isoformat()})"
                ),
                was_ambiguous=False,
            )


    # ============================================================
    # 7) 실패 -> 모호함
    # ============================================================

    return PeriodResult(
        period_type="",
        start_date="",
        end_date="",
        start_datetime="",
        end_datetime="",
        compare_start="",
        compare_end="",
        compare_label="",
        display_label="",
        was_ambiguous=True,
    )


# 입력창 위에 노출할 안내 문구 (요청하신 그대로) - 프론트에서 그대로 렌더링하거나
# 이 값을 API로 내려줘서 프론트가 표시하게 해도 됨.
PERIOD_INPUT_HINT = "예: \"25년 8월 월간수치 보여줘\"처럼 요청해보세요"

# 되묻기(clarify) 응답에 넣을 예시 모음 (일/주/월/분기/년 각 1개씩)
PERIOD_EXAMPLES = [
    "오늘 판매현황 보여줘",
    "8월 7일 주 판매현황 보여줘",
    "25년 8월 월간수치 보여줘",
    "25년 3분기 리포트 보여줘",
    "2025년 연간 리포트 보여줘",
]

def to_card_label(period: "PeriodResult") -> str:
    """
    리포트 상단 '기간 카드'용 짧은 포맷.
    예) 월간 -> "25년 8월 월간데이터(25.08.01-25.08.31)"
        주간 -> "25년 8월 11일 주간데이터(25.08.11-25.08.17)"
        일간 -> "25년 8월 5일 일간데이터(25.08.05)"
        분기 -> "25년 3분기 분기데이터(25.07.01-25.09.30)"
        연간 -> "25년 연간데이터(25.01.01-25.12.31)"
    """
    if period.was_ambiguous or not period.start_date:
        return ""

    start = date.fromisoformat(period.start_date)
    end = date.fromisoformat(period.end_date)
    yy = f"{start.year % 100:02d}"

    def ymd(d: date) -> str:
        return f"{d.year % 100:02d}.{d.month:02d}.{d.day:02d}"

    if period.period_type == "daily":
        return f"{yy}년 {start.month}월 {start.day}일 일간데이터({ymd(start)})"
    if period.period_type == "weekly":
        return f"{yy}년 {start.month}월 {start.day}일 주간데이터({ymd(start)}-{ymd(end)})"
    if period.period_type == "monthly":
        return f"{yy}년 {start.month}월 월간데이터({ymd(start)}-{ymd(end)})"
    if period.period_type == "quarterly":
        q = (start.month - 1) // 3 + 1
        return f"{yy}년 {q}분기 분기데이터({ymd(start)}-{ymd(end)})"
    if period.period_type == "yearly":
        return f"{yy}년 연간데이터({ymd(start)}-{ymd(end)})"
    return period.display_label

# if __name__ == "__main__":
#     fixed_today = date(2025, 8, 15)  # 금요일
#     tests = [
#         "오늘 판매현황 보여줘",
#         "25년 8월 월간수치 보여줘",
#         "8월 5일 판매실적 보여줘",
#         "25년 3분기 리포트 보여줘",
#         "Q3 리포트 보여줘",
#         "2025년 연간 리포트",
#         "이번 주 판매현황 리포트 뽑아줘",  # 오늘이 8/15(금)이므로 그 주 월요일=8/11
#         "저번주 판매현황 리포트 작성해줘",
#         "리포트 작성해줘",       # 모호
#         "요즘 매출 어때",        # 모호
#     ]
#     for t in tests:
#         r = parse_period(t, today=fixed_today)
#         if r.was_ambiguous:
#             print(f"[{t}]\n  -> 모호함 (되묻기 필요)\n")
#         else:
#             print(f"[{t}]\n  -> {r.display_label}  (type={r.period_type})\n"
#                   f"     start_datetime={r.start_datetime}  end_datetime={r.end_datetime}\n"
#                   f"     비교: {r.compare_label} {r.compare_start}~{r.compare_end}\n")

if __name__ == "__main__":
    fixed_today = date(2025, 8, 15)

    tests = [
        "오늘 판매현황 보여줘",
        "25년 8월 월간수치 보여줘",
        "8월 5일 판매실적 보여줘",
        "25년 3분기 리포트 보여줘",
        "Q3 리포트 보여줘",
        "2025년 연간 리포트",
        "이번 주 판매현황 리포트 뽑아줘",
        "저번주 판매현황 리포트 작성해줘",
        "리포트 작성해줘",
    ]

    for text in tests:
        period = parse_period(text, today=fixed_today)

        print("=" * 60)
        print("INPUT :", text)
        print("TYPE  :", period.period_type)
        print("START :", period.start_date)
        print("END   :", period.end_date)
        print("AMBIG :", period.was_ambiguous)
        print("CARD  :", repr(to_card_label(period)))