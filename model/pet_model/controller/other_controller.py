from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from model.pet_model.core.database import get_db
from model.pet_model.core.response import success, error, page_result
from model.pet_model.schemas.other import (
    FavoriteCreate,
    MessageCreate,
    ReviewCreate,
    QuestionCreate,
    QuestionUpdate,
    AnswerCreate,
    ArticleCreate,
    ArticleUpdate,
    NoticeCreate,
    NoticeUpdate,
    ReportCreate,
    ReportUpdate,
    FavoriteDetailResponse,
    MessageDetailResponse,
    ReviewDetailResponse,
    QuestionDetailResponse,
    AnswerDetailResponse,
)
from model.pet_model.business.other_business import (
    create_favorite,
    delete_favorite,
    get_favorite_list,
    check_favorite,
    create_message,
    get_message_list,
    mark_message_read,
    get_unread_message_count,
    create_review,
    get_review_list,
    create_question,
    update_question,
    get_question,
    get_question_list,
    increment_question_view,
    create_answer,
    get_answer_list,
    create_article,
    update_article,
    get_article,
    get_article_list,
    increment_article_view,
    delete_article,
    create_notice,
    update_notice,
    get_notice_list,
    delete_notice,
    create_report,
    update_report,
    get_report_list,
)

router = APIRouter(prefix="/api", tags=["其他接口"])


@router.post("/favorite/create", summary="收藏宠物")
def create_favorite_info(favorite: FavoriteCreate, user_id: int, db: Session = Depends(get_db)):
    existing = check_favorite(db, user_id, favorite.pet_id)
    if existing:
        return error("已收藏该宠物")
    db_favorite = create_favorite(db, favorite, user_id)
    return success(db_favorite, "收藏成功")


@router.delete("/favorite/delete/{favorite_id}", summary="取消收藏")
def delete_favorite_info(favorite_id: int, user_id: int, db: Session = Depends(get_db)):
    result = delete_favorite(db, favorite_id, user_id)
    if not result:
        return error("收藏不存在")
    return success(None, "取消收藏成功")


@router.get("/favorite/list", summary="获取收藏列表")
def get_favorites(user_id: int, page: int = 1, page_size: int = 10, db: Session = Depends(get_db)):
    results, total = get_favorite_list(db, user_id, page, page_size)
    list_data = []
    for favorite, pet in results:
        list_data.append(
            FavoriteDetailResponse(
                id=favorite.id,
                user_id=favorite.user_id,
                pet_id=favorite.pet_id,
                created_at=favorite.created_at,
                pet_name=pet.name,
                pet_images=pet.images,
                pet_status=pet.status,
            )
        )
    return page_result(list_data, total, page, page_size)


@router.get("/favorite/check", summary="检查是否已收藏")
def check_favorite_info(user_id: int, pet_id: int, db: Session = Depends(get_db)):
    existing = check_favorite(db, user_id, pet_id)
    return success({"is_favorite": existing is not None, "favorite_id": existing.id if existing else None})


@router.post("/message/send", summary="发送消息")
def send_message(message: MessageCreate, sender_id: int, db: Session = Depends(get_db)):
    db_message = create_message(db, message, sender_id)
    return success(db_message, "发送成功")


@router.get("/message/list", summary="获取消息列表")
def get_messages(
    user_id: int,
    other_user_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    results, total = get_message_list(db, user_id, other_user_id, page, page_size)
    list_data = []
    for message, sender in results:
        list_data.append(
            MessageDetailResponse(
                id=message.id,
                sender_id=message.sender_id,
                receiver_id=message.receiver_id,
                content=message.content,
                type=message.type,
                is_read=message.is_read,
                created_at=message.created_at,
                sender_nickname=sender.nickname,
                sender_avatar=sender.avatar,
            )
        )
    return page_result(list_data, total, page, page_size)


@router.put("/message/read/{message_id}", summary="标记消息已读")
def read_message(message_id: int, user_id: int, db: Session = Depends(get_db)):
    result = mark_message_read(db, message_id, user_id)
    if not result:
        return error("消息不存在")
    return success(None, "标记成功")


@router.get("/message/unread-count", summary="获取未读消息数")
def get_unread_count(user_id: int, db: Session = Depends(get_db)):
    count = get_unread_message_count(db, user_id)
    return success({"unread_count": count})


@router.post("/review/create", summary="提交评价")
def create_review_info(review: ReviewCreate, user_id: int, db: Session = Depends(get_db)):
    db_review = create_review(db, review, user_id)
    return success(db_review, "评价成功")


@router.get("/review/list", summary="获取评价列表")
def get_reviews(
    pet_id: Optional[int] = None,
    user_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
):
    results, total = get_review_list(db, pet_id, user_id, page, page_size)
    list_data = []
    for review, user in results:
        list_data.append(
            ReviewDetailResponse(
                id=review.id,
                pet_id=review.pet_id,
                user_id=review.user_id,
                content=review.content,
                rating=review.rating,
                images=review.images,
                created_at=review.created_at,
                user_nickname=user.nickname,
                user_avatar=user.avatar,
            )
        )
    return page_result(list_data, total, page, page_size)


@router.post("/question/create", summary="发布问题")
def create_question_info(question: QuestionCreate, user_id: int, db: Session = Depends(get_db)):
    db_question = create_question(db, question, user_id)
    return success(db_question, "发布成功")


@router.put("/question/update/{question_id}", summary="更新问题")
def update_question_info(
    question_id: int, question_update: QuestionUpdate, user_id: int, db: Session = Depends(get_db)
):
    db_question = update_question(db, question_id, question_update, user_id)
    if not db_question:
        return error("问题不存在或无权限")
    return success(db_question, "更新成功")


@router.get("/question/detail/{question_id}", summary="获取问题详情")
def get_question_info(question_id: int, db: Session = Depends(get_db)):
    db_question = get_question(db, question_id)
    if not db_question:
        return error("问题不存在")
    increment_question_view(db, question_id)
    return success(db_question)


@router.get("/question/list", summary="获取问题列表")
def get_questions(
    keyword: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
):
    results, total = get_question_list(db, keyword, page, page_size)
    list_data = []
    for question, user in results:
        list_data.append(
            QuestionDetailResponse(
                id=question.id,
                user_id=question.user_id,
                title=question.title,
                content=question.content,
                images=question.images,
                view_count=question.view_count,
                status=question.status,
                created_at=question.created_at,
                user_nickname=user.nickname,
                user_avatar=user.avatar,
            )
        )
    return page_result(list_data, total, page, page_size)


@router.post("/answer/create", summary="提交回答")
def create_answer_info(answer: AnswerCreate, user_id: int, db: Session = Depends(get_db)):
    db_answer = create_answer(db, answer, user_id)
    return success(db_answer, "回答成功")


@router.get("/answer/list", summary="获取回答列表")
def get_answers(question_id: int, page: int = 1, page_size: int = 20, db: Session = Depends(get_db)):
    results, total = get_answer_list(db, question_id, page, page_size)
    list_data = []
    for answer, user in results:
        list_data.append(
            AnswerDetailResponse(
                id=answer.id,
                question_id=answer.question_id,
                user_id=answer.user_id,
                content=answer.content,
                images=answer.images,
                like_count=answer.like_count,
                created_at=answer.created_at,
                user_nickname=user.nickname,
                user_avatar=user.avatar,
            )
        )
    return page_result(list_data, total, page, page_size)


@router.post("/article/create", summary="创建文章")
def create_article_info(article: ArticleCreate, db: Session = Depends(get_db)):
    db_article = create_article(db, article)
    return success(db_article, "创建成功")


@router.put("/article/update/{article_id}", summary="更新文章")
def update_article_info(article_id: int, article_update: ArticleUpdate, db: Session = Depends(get_db)):
    db_article = update_article(db, article_id, article_update)
    if not db_article:
        return error("文章不存在")
    return success(db_article, "更新成功")


@router.get("/article/detail/{article_id}", summary="获取文章详情")
def get_article_info(article_id: int, db: Session = Depends(get_db)):
    db_article = get_article(db, article_id)
    if not db_article:
        return error("文章不存在")
    increment_article_view(db, article_id)
    return success(db_article)


@router.get("/article/list", summary="获取文章列表")
def get_articles(
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
):
    articles, total = get_article_list(db, category, keyword, page, page_size)
    return page_result(articles, total, page, page_size)


@router.delete("/article/delete/{article_id}", summary="删除文章")
def delete_article_info(article_id: int, db: Session = Depends(get_db)):
    result = delete_article(db, article_id)
    if not result:
        return error("文章不存在")
    return success(None, "删除成功")


@router.post("/notice/create", summary="创建公告")
def create_notice_info(notice: NoticeCreate, db: Session = Depends(get_db)):
    db_notice = create_notice(db, notice)
    return success(db_notice, "创建成功")


@router.put("/notice/update/{notice_id}", summary="更新公告")
def update_notice_info(notice_id: int, notice_update: NoticeUpdate, db: Session = Depends(get_db)):
    db_notice = update_notice(db, notice_id, notice_update)
    if not db_notice:
        return error("公告不存在")
    return success(db_notice, "更新成功")


@router.get("/notice/list", summary="获取公告列表")
def get_notices(type: Optional[str] = None, page: int = 1, page_size: int = 10, db: Session = Depends(get_db)):
    notices, total = get_notice_list(db, type, page, page_size)
    return page_result(notices, total, page, page_size)


@router.delete("/notice/delete/{notice_id}", summary="删除公告")
def delete_notice_info(notice_id: int, db: Session = Depends(get_db)):
    result = delete_notice(db, notice_id)
    if not result:
        return error("公告不存在")
    return success(None, "删除成功")


@router.post("/report/create", summary="提交举报")
def create_report_info(report: ReportCreate, reporter_id: int, db: Session = Depends(get_db)):
    db_report = create_report(db, report, reporter_id)
    return success(db_report, "举报提交成功")


@router.put("/report/update/{report_id}", summary="处理举报")
def update_report_info(report_id: int, report_update: ReportUpdate, db: Session = Depends(get_db)):
    db_report = update_report(db, report_id, report_update)
    if not db_report:
        return error("举报不存在")
    return success(db_report, "处理完成")


@router.get("/report/list", summary="获取举报列表")
def get_reports(status: Optional[str] = None, page: int = 1, page_size: int = 10, db: Session = Depends(get_db)):
    reports, total = get_report_list(db, status, page, page_size)
    return page_result(reports, total, page, page_size)
