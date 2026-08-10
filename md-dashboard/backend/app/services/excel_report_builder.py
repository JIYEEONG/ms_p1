# app/services/excel_report_builder.py
"""
tools.py의 개별 함수 호출 결과를 모아 엑셀 생성에 필요한 데이터 하나로 조립.
period_meta(프론트가 이미 가지고 있는 값 - 리포트 생성 시 파싱된 기간)를 그대로 받아서 재사용하고,
기간을 다시 파싱하지 않는다 (프론트-백엔드 왕복에서 파싱 결과가 달라질 위험 제거).
"""

from datetime import date, timedelta
from typing import Any, Dict, List

from app.services.tools import (
    get_category_performance, get_best10, get_item_level_detail, get_daily_trend,
)


def _bucket_trend(daily_rows: List[Dict[str, Any]], period_type: str) -> List[Dict[str, Any]]:
    """
    일별 매출 리스트를 기간 유형에 맞는 그래프용 단위로 묶는다.
      - daily/weekly/monthly -> 일 단위 그대로
      - quarterly -> 주 단위로 묶음 (달력 주 아니라 '기간 시작일 기준 7일 묶음' - 상대 위치 정렬용)
      - yearly -> 월 단위로 묶음
    반환: [{"label": "1일차"/"1주차"/"1월차", "value": 합계}, ...] (상대 인덱스 기준 라벨 - 두 기간 길이가
    달라도 같은 인덱스끼리 비교 가능하게 하기 위함. 실제 날짜가 아니라 '기간 내 몇 번째'로 정렬.)
    """
    if not daily_rows:
        return []

    if period_type in ("daily", "weekly", "monthly"):
        return [{"label": f"{i+1}일차", "value": row["revenue"]} for i, row in enumerate(daily_rows)]

    if period_type == "quarterly":
        buckets = []
        for i in range(0, len(daily_rows), 7):
            chunk = daily_rows[i:i+7]
            buckets.append({"label": f"{i//7 + 1}주차", "value": sum(r["revenue"] for r in chunk)})
        return buckets

    if period_type == "yearly":
        # 30일 단위로 근사 (달력 월 경계까지 맞추려면 date 파싱 필요하나, 상대 비교 목적이라 근사로 충분)
        buckets = []
        for i in range(0, len(daily_rows), 30):
            chunk = daily_rows[i:i+30]
            buckets.append({"label": f"{i//30 + 1}월차", "value": sum(r["revenue"] for r in chunk)})
        return buckets

    return [{"label": f"{i+1}일차", "value": row["revenue"]} for i, row in enumerate(daily_rows)]


def build_excel_report_data(period_meta: Dict[str, Any]) -> Dict[str, Any]:
    """
    period_meta: 프론트가 보내주는, 리포트 생성 시 이미 파싱된 기간 정보
      (period_type, start_datetime, end_datetime, compare_start, compare_end,
       compare_label, display_label 등 - period_parser.PeriodResult.to_dict() 형태)
    """
    period_type = period_meta.get("period_type", "weekly")
    cur_start, cur_end = period_meta["start_datetime"], period_meta["end_datetime"]

    # compare_start/compare_end는 날짜만 있으므로(YYYY-MM-DD) 시분초 붙여줌
    cmp_start_date, cmp_end_date = period_meta["compare_start"], period_meta["compare_end"]
    cmp_start = f"{cmp_start_date} 00:00:00"
    cmp_end = f"{cmp_end_date} 23:59:59"

    category_large_top5 = get_category_performance(cur_start, cur_end, level="large")
    category_mid_top5 = get_category_performance(cur_start, cur_end, level="middle")
    best10 = get_best10(cur_start, cur_end)

    current_items = get_item_level_detail(cur_start, cur_end)
    compare_items = get_item_level_detail(cmp_start, cmp_end)

    current_trend_raw = get_daily_trend(cur_start, cur_end)
    compare_trend_raw = get_daily_trend(cmp_start, cmp_end)

    current_trend = _bucket_trend(current_trend_raw, period_type)
    compare_trend = _bucket_trend(compare_trend_raw, period_type)

    return {
        "period_card_label": period_meta.get("period_card_label") or period_meta.get("display_label", ""),
        "period_meta": period_meta,
        "category_large_top5": category_large_top5,
        "category_mid_top5": category_mid_top5,
        "best10": best10,
        "current_period_items": current_items,
        "comparison_period_items": compare_items,
        "current_trend": current_trend,
        "compare_trend": compare_trend,
    }