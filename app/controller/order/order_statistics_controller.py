from typing import Optional


class OrderStatisticsController:
    def __init__(self):
        from app.business.order.statistics_business import OrderStatisticsBusiness
        self.statistics_business = OrderStatisticsBusiness()

    def ActionOrderStatisticsGet(self, start_date: Optional[str] = None,
                                  end_date: Optional[str] = None):
        return self.statistics_business.get_statistics(start_date, end_date)

    def ActionOrderDailyStatisticsGet(self, date: str):
        return self.statistics_business.get_daily_summary(date)