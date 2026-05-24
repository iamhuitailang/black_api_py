from datetime import datetime
from typing import Dict, Any, List, Optional
from app.model.mxt import CoinModel, CoinLogModel


COIN_CONFIG = {
    'submit_application': 1,
    'hired': 10,
    'share_card': 5,
    'daily_login': 3,
    'refresh_hot': -5,
    'urgent_apply': -10,
    'unlock_hidden': -20
}


class CoinBusiness:
    def __init__(self):
        self.coin_model = CoinModel()
        self.log_model = CoinLogModel()

    def get_user_coins(self, user_key: str) -> Dict[str, Any]:
        user = self.coin_model.get_or_create(user_key)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'user_key': user.get('user_key'),
                'balance': user.get('balance', 0),
                'last_login_date': user.get('last_login_date', '')
            }
        }

    def _add_coins(self, user_key: str, amount: int, log_type: str, description: str = '') -> Dict[str, Any]:
        user = self.coin_model.get_or_create(user_key)
        current_balance = user.get('balance', 0)
        new_balance = current_balance + amount
        
        if new_balance < 0:
            return {
                'code': 1,
                'message': '金币不足',
                'data': None
            }
        
        self.coin_model.update_balance(user.get('id'), new_balance)
        self.log_model.create(
            user_key=user_key,
            amount=amount,
            log_type=log_type,
            description=description,
            balance_after=new_balance
        )
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'user_key': user_key,
                'balance': new_balance,
                'added': amount
            }
        }

    def reward_submit(self, user_key: str) -> Dict[str, Any]:
        return self._add_coins(
            user_key=user_key,
            amount=COIN_CONFIG['submit_application'],
            log_type='submit',
            description='投递简历奖励'
        )

    def reward_hired(self, user_key: str) -> Dict[str, Any]:
        return self._add_coins(
            user_key=user_key,
            amount=COIN_CONFIG['hired'],
            log_type='hired',
            description='被录用奖励'
        )

    def reward_share(self, user_key: str) -> Dict[str, Any]:
        return self._add_coins(
            user_key=user_key,
            amount=COIN_CONFIG['share_card'],
            log_type='share',
            description='分享员工证奖励'
        )

    def reward_daily_login(self, user_key: str) -> Dict[str, Any]:
        today = datetime.now().strftime('%Y-%m-%d')
        user = self.coin_model.get_or_create(user_key)
        
        if user.get('last_login_date') == today:
            return {
                'code': 0,
                'message': '今日已领取',
                'data': {
                    'user_key': user_key,
                    'balance': user.get('balance', 0),
                    'added': 0
                }
            }
        
        self.coin_model.update_last_login(user.get('id'), today)
        return self._add_coins(
            user_key=user_key,
            amount=COIN_CONFIG['daily_login'],
            log_type='daily_login',
            description='每日登录奖励'
        )

    def spend_refresh_hot(self, user_key: str) -> Dict[str, Any]:
        return self._add_coins(
            user_key=user_key,
            amount=COIN_CONFIG['refresh_hot'],
            log_type='refresh_hot',
            description='刷新今日推荐'
        )

    def spend_urgent_apply(self, user_key: str) -> Dict[str, Any]:
        return self._add_coins(
            user_key=user_key,
            amount=COIN_CONFIG['urgent_apply'],
            log_type='urgent_apply',
            description='加急处理投递'
        )

    def spend_unlock_hidden(self, user_key: str) -> Dict[str, Any]:
        return self._add_coins(
            user_key=user_key,
            amount=COIN_CONFIG['unlock_hidden'],
            log_type='unlock_hidden',
            description='解锁隐藏职位'
        )

    def get_coin_logs(self, user_key: str) -> Dict[str, Any]:
        logs = self.log_model.get_by_user_key(user_key)
        
        return {
            'code': 0,
            'message': 'success',
            'data': logs
        }

    def get_coin_config(self) -> Dict[str, Any]:
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'submit_application': abs(COIN_CONFIG['submit_application']),
                'hired': abs(COIN_CONFIG['hired']),
                'share_card': abs(COIN_CONFIG['share_card']),
                'daily_login': abs(COIN_CONFIG['daily_login']),
                'refresh_hot': abs(COIN_CONFIG['refresh_hot']),
                'urgent_apply': abs(COIN_CONFIG['urgent_apply']),
                'unlock_hidden': abs(COIN_CONFIG['unlock_hidden'])
            }
        }

    def get_all_users(self) -> Dict[str, Any]:
        users = self.coin_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': users
        }
