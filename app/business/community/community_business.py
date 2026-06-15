from datetime import datetime, date
from typing import Dict, Any, List, Optional
from app.model.community import ItemModel, BorrowRequestModel, BorrowRecordModel, ReviewModel, NotificationModel
from app.model.auth.user import UserModel


class CommunityBusiness:
    def __init__(self):
        self.item_model = ItemModel()
        self.request_model = BorrowRequestModel()
        self.record_model = BorrowRecordModel()
        self.review_model = ReviewModel()
        self.user_model = UserModel()
        self.notif_model = NotificationModel()

    def publish_item(self, owner_id: int, name: str, category: str, description: str,
                     condition: str, borrow_rule: str, available_times: list,
                     image_url: str = None) -> Dict[str, Any]:
        item_id = self.item_model.create(
            owner_id=owner_id,
            name=name,
            category=category,
            description=description,
            condition=condition,
            borrow_rule=borrow_rule,
            available_times=available_times,
            image_url=image_url
        )
        item = self.item_model.get_by_id(item_id)
        return {
            'code': 0,
            'message': '发布成功',
            'data': item
        }

    def get_item_list(self, category: str = None, condition: str = None, status: str = None,
                      owner_id: int = None, keyword: str = None,
                      page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.item_model.get_list(
            category=category,
            condition=condition,
            status=status,
            owner_id=owner_id,
            keyword=keyword,
            page=page,
            page_size=page_size
        )
        for item in result['items']:
            owner = self.user_model.get_public_profile(item['owner_id'])
            item['owner'] = owner
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_item_detail(self, item_id: int) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'message': '物品不存在',
                'data': None
            }
        owner = self.user_model.get_public_profile(item['owner_id'])
        item['owner'] = owner
        reviews = self.review_model.get_list_by_item(item_id)
        for review in reviews:
            reviewer = self.user_model.get_public_profile(review['reviewer_id'])
            review['reviewer'] = reviewer
        item['reviews'] = reviews
        avg_rating = self.review_model.get_average_rating(item['owner_id'])
        item['owner_rating'] = avg_rating
        return {
            'code': 0,
            'message': 'success',
            'data': item
        }

    def update_item(self, user_id: int, item_id: int, **kwargs) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'message': '物品不存在',
                'data': None
            }
        if item['owner_id'] != user_id:
            return {
                'code': 2,
                'message': '无权限修改',
                'data': None
            }
        self.item_model.update(item_id, **kwargs)
        updated_item = self.item_model.get_by_id(item_id)
        return {
            'code': 0,
            'message': '更新成功',
            'data': updated_item
        }

    def delete_item(self, user_id: int, item_id: int) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'message': '物品不存在',
                'data': None
            }
        if item['owner_id'] != user_id:
            return {
                'code': 2,
                'message': '无权限删除',
                'data': None
            }
        self.item_model.delete(item_id)
        return {
            'code': 0,
            'message': '删除成功',
            'data': None
        }

    def create_borrow_request(self, borrower_id: int, item_id: int,
                              date_range: dict, message: str = None) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'message': '物品不存在',
                'data': None
            }
        if item['owner_id'] == borrower_id:
            return {
                'code': 2,
                'message': '不能借用自己发布的物品',
                'data': None
            }
        if item['status'] != ItemModel.STATUS_AVAILABLE:
            return {
                'code': 3,
                'message': '物品当前不可借用',
                'data': None
            }

        if self.request_model.has_pending_request(borrower_id, item_id):
            return {
                'code': 4,
                'message': '您已对此物品提交过申请，请耐心等待审核',
                'data': None
            }

        conflict_msg = self._check_date_conflict(item_id, date_range)
        if conflict_msg:
            return {
                'code': 5,
                'message': conflict_msg,
                'data': None
            }

        request_id = self.request_model.create(
            item_id=item_id,
            borrower_id=borrower_id,
            date_range=date_range,
            message=message
        )
        request = self.request_model.get_by_id(request_id)

        borrower = self.user_model.get_public_profile(borrower_id)
        borrower_name = borrower['nickname'] if borrower else '用户'
        self.notif_model.create(
            user_id=item['owner_id'],
            notif_type=NotificationModel.TYPE_REQUEST,
            title=f'📩 收到新的借用申请',
            content=f'{borrower_name} 想借用您的「{item["name"]}」，请及时处理。',
            related_id=request_id
        )

        return {
            'code': 0,
            'message': '申请已提交',
            'data': request
        }

    def _check_date_conflict(self, item_id: int, date_range: dict) -> Optional[str]:
        """检查日期范围是否有冲突，返回冲突描述，无冲突返回None"""
        new_start = date_range.get('start')
        new_end = date_range.get('end')
        if not new_start or not new_end:
            return '请填写完整的借用日期'

        try:
            ns = date.fromisoformat(new_start)
            ne = date.fromisoformat(new_end)
            if ns > ne:
                return '归还日期不能早于借用日期'
        except (ValueError, TypeError):
            return '日期格式不正确'

        approved_requests = self.request_model.get_approved_date_ranges(item_id)
        for req in approved_requests:
            dr = req.get('date_range', {})
            s = dr.get('start')
            e = dr.get('end')
            if not s or not e:
                continue
            try:
                es = date.fromisoformat(s)
                ee = date.fromisoformat(e)
                if not (ne < es or ns > ee):
                    return f'该物品在 {s} 至 {e} 已被预约，请选择其他日期'
            except (ValueError, TypeError):
                continue

        active_records = self.record_model.get_active_borrow_dates(item_id)
        for rec in active_records:
            s = rec.get('borrow_date')
            e = rec.get('expected_return_date')
            if not s or not e:
                continue
            try:
                es = date.fromisoformat(s)
                ee = date.fromisoformat(e)
                if not (ne < es or ns > ee):
                    return f'该物品在 {s} 至 {e} 正在借出中，请选择其他日期'
            except (ValueError, TypeError):
                continue

        return None

    def get_borrow_requests_by_borrower(self, borrower_id: int, status: str = None) -> Dict[str, Any]:
        requests = self.request_model.get_list_by_borrower(borrower_id, status)
        for req in requests:
            item = self.item_model.get_by_id(req['item_id'])
            req['item'] = item
            if item:
                owner = self.user_model.get_public_profile(item['owner_id'])
                req['owner'] = owner
        return {
            'code': 0,
            'message': 'success',
            'data': requests
        }

    def get_borrow_requests_by_owner(self, owner_id: int, status: str = None) -> Dict[str, Any]:
        requests = self.request_model.get_list_by_owner(owner_id, status)
        for req in requests:
            item = self.item_model.get_by_id(req['item_id'])
            borrower = self.user_model.get_public_profile(req['borrower_id'])
            req['item'] = item
            req['borrower'] = borrower
            borrower_rating = self.review_model.get_average_rating(req['borrower_id'])
            req['borrower_rating'] = borrower_rating
        return {
            'code': 0,
            'message': 'success',
            'data': requests
        }

    def approve_borrow_request(self, owner_id: int, request_id: int) -> Dict[str, Any]:
        request = self.request_model.get_by_id(request_id)
        if not request:
            return {
                'code': 1,
                'message': '申请不存在',
                'data': None
            }
        item = self.item_model.get_by_id(request['item_id'])
        if not item or item['owner_id'] != owner_id:
            return {
                'code': 2,
                'message': '无权限操作',
                'data': None
            }
        if request['status'] != BorrowRequestModel.STATUS_PENDING:
            return {
                'code': 3,
                'message': '申请状态不允许审批',
                'data': None
            }
        self.request_model.update_status(request_id, BorrowRequestModel.STATUS_APPROVED)
        self.item_model.update_status(request['item_id'], ItemModel.STATUS_BORROWED)
        date_range = request.get('date_range', {})
        borrow_date = date_range.get('start') or datetime.now().isoformat()[:10]
        expected_return = date_range.get('end')
        record_id = self.record_model.create(
            request_id=request_id,
            borrow_date=borrow_date,
            expected_return_date=expected_return
        )
        record = self.record_model.get_by_id(record_id)
        updated_request = self.request_model.get_by_id(request_id)
        updated_request['record'] = record

        item = self.item_model.get_by_id(request['item_id'])
        owner = self.user_model.get_public_profile(owner_id)
        owner_name = owner['nickname'] if owner else '发布者'
        self.notif_model.create(
            user_id=request['borrower_id'],
            notif_type=NotificationModel.TYPE_APPROVED,
            title=f'✅ 您的借用申请已通过',
            content=f'{owner_name} 同意了您借用「{item["name"] if item else "物品"}」的申请，请按时领取和归还。',
            related_id=request_id
        )

        return {
            'code': 0,
            'message': '已同意借用',
            'data': updated_request
        }

    def reject_borrow_request(self, owner_id: int, request_id: int, reason: str = None) -> Dict[str, Any]:
        request = self.request_model.get_by_id(request_id)
        if not request:
            return {
                'code': 1,
                'message': '申请不存在',
                'data': None
            }
        item = self.item_model.get_by_id(request['item_id'])
        if not item or item['owner_id'] != owner_id:
            return {
                'code': 2,
                'message': '无权限操作',
                'data': None
            }
        if request['status'] != BorrowRequestModel.STATUS_PENDING:
            return {
                'code': 3,
                'message': '申请状态不允许操作',
                'data': None
            }
        self.request_model.update_status(request_id, BorrowRequestModel.STATUS_REJECTED)

        owner = self.user_model.get_public_profile(owner_id)
        owner_name = owner['nickname'] if owner else '发布者'
        reason_text = f'拒绝原因：{reason}' if reason else ''
        self.notif_model.create(
            user_id=request['borrower_id'],
            notif_type=NotificationModel.TYPE_REJECTED,
            title=f'❌ 您的借用申请被拒绝',
            content=f'{owner_name} 拒绝了您借用「{item["name"] if item else "物品"}」的申请。{reason_text}',
            related_id=request_id
        )

        return {
            'code': 0,
            'message': '已拒绝申请',
            'data': None
        }

    def cancel_borrow_request(self, borrower_id: int, request_id: int) -> Dict[str, Any]:
        request = self.request_model.get_by_id(request_id)
        if not request:
            return {
                'code': 1,
                'message': '申请不存在',
                'data': None
            }
        if request['borrower_id'] != borrower_id:
            return {
                'code': 2,
                'message': '无权限操作',
                'data': None
            }
        if request['status'] != BorrowRequestModel.STATUS_PENDING:
            return {
                'code': 3,
                'message': '申请状态不允许取消',
                'data': None
            }
        self.request_model.update_status(request_id, BorrowRequestModel.STATUS_CANCELLED)
        return {
            'code': 0,
            'message': '已取消申请',
            'data': None
        }

    def mark_item_borrowed(self, owner_id: int, record_id: int) -> Dict[str, Any]:
        record = self.record_model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'message': '记录不存在',
                'data': None
            }
        request = self.request_model.get_by_id(record['request_id'])
        item = self.item_model.get_by_id(request['item_id'])
        if not item or item['owner_id'] != owner_id:
            return {
                'code': 2,
                'message': '无权限操作',
                'data': None
            }
        self.record_model.update_status(record_id, BorrowRecordModel.STATUS_BORROWED)
        self.item_model.update_status(request['item_id'], ItemModel.STATUS_BORROWED)
        return {
            'code': 0,
            'message': '已标记借出',
            'data': None
        }

    def mark_item_returned(self, owner_id: int, record_id: int) -> Dict[str, Any]:
        record = self.record_model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'message': '记录不存在',
                'data': None
            }
        request = self.request_model.get_by_id(record['request_id'])
        item = self.item_model.get_by_id(request['item_id'])
        if not item or item['owner_id'] != owner_id:
            return {
                'code': 2,
                'message': '无权限操作',
                'data': None
            }
        self.record_model.mark_returned(record_id)
        self.item_model.update_status(request['item_id'], ItemModel.STATUS_AVAILABLE)
        return {
            'code': 0,
            'message': '已标记归还',
            'data': None
        }

    def get_borrow_records_by_borrower(self, borrower_id: int, status: str = None) -> Dict[str, Any]:
        records = self.record_model.get_list_by_borrower(borrower_id, status)
        for record in records:
            request = self.request_model.get_by_id(record['request_id'])
            if request:
                item = self.item_model.get_by_id(request['item_id'])
                record['item'] = item
                owner = self.user_model.get_public_profile(item['owner_id']) if item else None
                record['owner'] = owner
                record['date_range'] = request.get('date_range', {})
                record['message'] = request.get('message')
            reviews = self.review_model.get_list_by_record(record['id'])
            record['reviews'] = reviews
            record['reviewed_by_me'] = any(r['reviewer_id'] == borrower_id for r in reviews)
        return {
            'code': 0,
            'message': 'success',
            'data': records
        }

    def get_borrow_records_by_owner(self, owner_id: int, status: str = None) -> Dict[str, Any]:
        records = self.record_model.get_list_by_owner(owner_id, status)
        for record in records:
            request = self.request_model.get_by_id(record['request_id'])
            if request:
                item = self.item_model.get_by_id(request['item_id'])
                borrower = self.user_model.get_public_profile(request['borrower_id'])
                record['item'] = item
                record['borrower'] = borrower
                record['date_range'] = request.get('date_range', {})
                record['message'] = request.get('message')
            reviews = self.review_model.get_list_by_record(record['id'])
            record['reviews'] = reviews
            record['reviewed_by_me'] = any(r['reviewer_id'] == owner_id for r in reviews)
        return {
            'code': 0,
            'message': 'success',
            'data': records
        }

    def create_review(self, reviewer_id: int, record_id: int,
                      rating: int, comment: str = None) -> Dict[str, Any]:
        if rating < 1 or rating > 5:
            return {
                'code': 1,
                'message': '评分必须在1-5之间',
                'data': None
            }
        record = self.record_model.get_by_id(record_id)
        if not record:
            return {
                'code': 2,
                'message': '记录不存在',
                'data': None
            }
        if record['status'] != BorrowRecordModel.STATUS_RETURNED:
            return {
                'code': 3,
                'message': '只有归还后才能评价',
                'data': None
            }
        existing = self.review_model.get_by_record_and_reviewer(record_id, reviewer_id)
        if existing:
            return {
                'code': 4,
                'message': '已评价过，不能重复评价',
                'data': None
            }
        request = self.request_model.get_by_id(record['request_id'])
        item = self.item_model.get_by_id(request['item_id'])
        if reviewer_id == item['owner_id']:
            target_user_id = request['borrower_id']
        elif reviewer_id == request['borrower_id']:
            target_user_id = item['owner_id']
        else:
            return {
                'code': 5,
                'message': '无权限评价',
                'data': None
            }
        review_id = self.review_model.create(
            record_id=record_id,
            reviewer_id=reviewer_id,
            target_user_id=target_user_id,
            rating=rating,
            comment=comment
        )
        avg_rating_data = self.review_model.get_average_rating(target_user_id)
        self.user_model.update_credit_score(target_user_id, avg_rating_data['avg_rating'])
        review = self.review_model.get_by_id(review_id)
        return {
            'code': 0,
            'message': '评价成功',
            'data': review
        }

    def get_user_credit(self, user_id: int) -> Dict[str, Any]:
        profile = self.user_model.get_public_profile(user_id)
        if not profile:
            return {
                'code': 1,
                'message': '用户不存在',
                'data': None
            }
        rating_stats = self.review_model.get_average_rating(user_id)
        reviews = self.review_model.get_list_by_target_user(user_id)
        for review in reviews:
            reviewer = self.user_model.get_public_profile(review['reviewer_id'])
            review['reviewer'] = reviewer
        profile.update(rating_stats)
        profile['reviews'] = reviews
        my_items = self.item_model.get_list(owner_id=user_id, page=1, page_size=100)
        profile['items_count'] = my_items['total']
        return {
            'code': 0,
            'message': 'success',
            'data': profile
        }

    def check_overdue_reminders(self) -> Dict[str, Any]:
        overdue_records = self.record_model.get_overdue_records(days_overdue=3)
        reminders = []
        for record in overdue_records:
            self.record_model.mark_overdue(record['id'])
            self.record_model.mark_reminder_sent(record['id'])
            request = self.request_model.get_by_id(record['request_id'])
            if request:
                item = self.item_model.get_by_id(request['item_id'])
                borrower = self.user_model.get_public_profile(request['borrower_id'])
                owner = self.user_model.get_public_profile(item['owner_id']) if item else None
                
                item_name = item['name'] if item else '物品'
                borrower_name = borrower['nickname'] if borrower else '用户'
                owner_name = owner['nickname'] if owner else '发布者'
                
                self.notif_model.create(
                    user_id=request['borrower_id'],
                    notif_type=NotificationModel.TYPE_OVERDUE,
                    title=f'⚠️ 借用物品已超时',
                    content=f'您借用的「{item_name}」已超过约定归还日期3天，请尽快归还。逾期记录可能影响您的信誉。',
                    related_id=record['id']
                )
                
                if item and item.get('owner_id'):
                    self.notif_model.create(
                        user_id=item['owner_id'],
                        notif_type=NotificationModel.TYPE_OVERDUE,
                        title=f'⏰ 借出物品已超时',
                        content=f'您借出的「{item_name}」已超过约定归还日期3天，借入用户：{borrower_name}。',
                        related_id=record['id']
                    )
                
                reminders.append({
                    'record_id': record['id'],
                    'item': item,
                    'borrower': borrower,
                    'expected_return_date': record['expected_return_date'],
                    'borrow_date': record['borrow_date']
                })
        return {
            'code': 0,
            'message': f'共处理{len(reminders)}条超时记录',
            'data': reminders
        }

    def get_user_overdue_reminders(self, user_id: int) -> Dict[str, Any]:
        self.check_overdue_reminders()
        records = self.record_model.get_list_by_borrower(user_id)
        overdue = [r for r in records if r['status'] in (BorrowRecordModel.STATUS_OVERDUE, BorrowRecordModel.STATUS_BORROWED)]
        result = []
        for r in overdue:
            request = self.request_model.get_by_id(r['request_id'])
            if request:
                item = self.item_model.get_by_id(request['item_id'])
                if r['expected_return_date']:
                    from datetime import datetime as dt
                    expected = dt.fromisoformat(r['expected_return_date']).date()
                    today = dt.now().date()
                    days_overdue = (today - expected).days
                    if days_overdue >= 3:
                        result.append({
                            'record_id': r['id'],
                            'item': item,
                            'expected_return_date': r['expected_return_date'],
                            'days_overdue': days_overdue,
                            'status': r['status']
                        })
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_contact_info(self, user_id: int, record_id: int) -> Dict[str, Any]:
        record = self.record_model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'message': '记录不存在',
                'data': None
            }
        request = self.request_model.get_by_id(record['request_id'])
        if request['status'] != BorrowRequestModel.STATUS_APPROVED:
            return {
                'code': 2,
                'message': '申请未通过，无法查看联系方式',
                'data': None
            }
        item = self.item_model.get_by_id(request['item_id'])
        is_owner = item['owner_id'] == user_id
        is_borrower = request['borrower_id'] == user_id
        if not is_owner and not is_borrower:
            return {
                'code': 3,
                'message': '无权限查看',
                'data': None
            }
        if is_owner:
            target_id = request['borrower_id']
        else:
            target_id = item['owner_id']
        contact = self.user_model.get_public_profile(target_id)
        return {
            'code': 0,
            'message': 'success',
            'data': contact
        }

    def get_notifications(self, user_id: int, unread_only: bool = False) -> Dict[str, Any]:
        notifs = self.notif_model.get_by_user(user_id, unread_only=unread_only)
        return {
            'code': 0,
            'message': 'success',
            'data': notifs
        }

    def count_unread_notifications(self, user_id: int) -> Dict[str, Any]:
        count = self.notif_model.count_unread(user_id)
        return {
            'code': 0,
            'message': 'success',
            'data': {'unread_count': count}
        }

    def mark_notification_read(self, user_id: int, notif_id: int) -> Dict[str, Any]:
        self.notif_model.mark_read(notif_id, user_id)
        return {
            'code': 0,
            'message': '已标记为已读',
            'data': None
        }

    def mark_all_notifications_read(self, user_id: int) -> Dict[str, Any]:
        self.notif_model.mark_all_read(user_id)
        return {
            'code': 0,
            'message': '已全部标记为已读',
            'data': None
        }
