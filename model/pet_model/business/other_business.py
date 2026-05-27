from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from model.pet_model.models.other import Favorite, Message, Review, Question, Answer, Article, Notice, Report
from model.pet_model.models.pet import Pet
from model.pet_model.models.user import User
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
)


def create_favorite(db: Session, favorite: FavoriteCreate, user_id: int) -> Favorite:
    db_favorite = Favorite(
        user_id=user_id,
        pet_id=favorite.pet_id,
    )
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    return db_favorite


def delete_favorite(db: Session, favorite_id: int, user_id: int) -> bool:
    db_favorite = db.query(Favorite).filter(Favorite.id == favorite_id, Favorite.user_id == user_id).first()
    if not db_favorite:
        return False
    db.delete(db_favorite)
    db.commit()
    return True


def get_favorite_list(db: Session, user_id: int, page: int = 1, page_size: int = 10) -> Tuple[List[Tuple[Favorite, Pet]], int]:
    query = db.query(Favorite, Pet).join(Pet, Favorite.pet_id == Pet.id).filter(Favorite.user_id == user_id)
    total = query.count()
    results = query.order_by(Favorite.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return results, total


def check_favorite(db: Session, user_id: int, pet_id: int) -> Optional[Favorite]:
    return db.query(Favorite).filter(Favorite.user_id == user_id, Favorite.pet_id == pet_id).first()


def create_message(db: Session, message: MessageCreate, sender_id: int) -> Message:
    db_message = Message(
        sender_id=sender_id,
        receiver_id=message.receiver_id,
        content=message.content,
        type=message.type,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def get_message_list(
    db: Session,
    user_id: int,
    other_user_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[Tuple[Message, User]], int]:
    query = db.query(Message, User).join(User, Message.sender_id == User.id)
    if other_user_id:
        query = query.filter(
            ((Message.sender_id == user_id) & (Message.receiver_id == other_user_id))
            | ((Message.sender_id == other_user_id) & (Message.receiver_id == user_id))
        )
    else:
        query = query.filter((Message.sender_id == user_id) | (Message.receiver_id == user_id))
    total = query.count()
    results = query.order_by(Message.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return results, total


def mark_message_read(db: Session, message_id: int, user_id: int) -> Optional[Message]:
    db_message = db.query(Message).filter(Message.id == message_id, Message.receiver_id == user_id).first()
    if db_message:
        db_message.is_read = 1
        db.commit()
        db.refresh(db_message)
    return db_message


def get_unread_message_count(db: Session, user_id: int) -> int:
    return db.query(Message).filter(Message.receiver_id == user_id, Message.is_read == 0).count()


def create_review(db: Session, review: ReviewCreate, user_id: int) -> Review:
    db_review = Review(
        pet_id=review.pet_id,
        user_id=user_id,
        content=review.content,
        rating=review.rating,
        images=review.images,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review


def get_review_list(
    db: Session,
    pet_id: Optional[int] = None,
    user_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[Tuple[Review, User]], int]:
    query = db.query(Review, User).join(User, Review.user_id == User.id)
    if pet_id:
        query = query.filter(Review.pet_id == pet_id)
    if user_id:
        query = query.filter(Review.user_id == user_id)
    total = query.count()
    results = query.order_by(Review.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return results, total


def create_question(db: Session, question: QuestionCreate, user_id: int) -> Question:
    db_question = Question(
        user_id=user_id,
        title=question.title,
        content=question.content,
        images=question.images,
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


def update_question(db: Session, question_id: int, question_update: QuestionUpdate, user_id: int) -> Optional[Question]:
    db_question = db.query(Question).filter(Question.id == question_id, Question.user_id == user_id).first()
    if not db_question:
        return None
    update_data = question_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_question, key, value)
    db.commit()
    db.refresh(db_question)
    return db_question


def get_question(db: Session, question_id: int) -> Optional[Question]:
    return db.query(Question).filter(Question.id == question_id).first()


def get_question_list(
    db: Session,
    keyword: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[Tuple[Question, User]], int]:
    query = db.query(Question, User).join(User, Question.user_id == User.id).filter(Question.status == 1)
    if keyword:
        query = query.filter(
            (Question.title.contains(keyword)) | (Question.content.contains(keyword))
        )
    total = query.count()
    results = query.order_by(Question.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return results, total


def increment_question_view(db: Session, question_id: int) -> None:
    db_question = get_question(db, question_id)
    if db_question:
        db_question.view_count += 1
        db.commit()


def create_answer(db: Session, answer: AnswerCreate, user_id: int) -> Answer:
    db_answer = Answer(
        question_id=answer.question_id,
        user_id=user_id,
        content=answer.content,
        images=answer.images,
    )
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    return db_answer


def get_answer_list(db: Session, question_id: int, page: int = 1, page_size: int = 20) -> Tuple[List[Tuple[Answer, User]], int]:
    query = db.query(Answer, User).join(User, Answer.user_id == User.id).filter(Answer.question_id == question_id)
    total = query.count()
    results = query.order_by(Answer.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return results, total


def create_article(db: Session, article: ArticleCreate) -> Article:
    db_article = Article(
        title=article.title,
        content=article.content,
        cover=article.cover,
        category=article.category,
    )
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article


def update_article(db: Session, article_id: int, article_update: ArticleUpdate) -> Optional[Article]:
    db_article = db.query(Article).filter(Article.id == article_id).first()
    if not db_article:
        return None
    update_data = article_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_article, key, value)
    db.commit()
    db.refresh(db_article)
    return db_article


def get_article(db: Session, article_id: int) -> Optional[Article]:
    return db.query(Article).filter(Article.id == article_id).first()


def get_article_list(
    db: Session,
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[Article], int]:
    query = db.query(Article).filter(Article.status == 1)
    if category:
        query = query.filter(Article.category == category)
    if keyword:
        query = query.filter(
            (Article.title.contains(keyword)) | (Article.content.contains(keyword))
        )
    total = query.count()
    articles = query.order_by(Article.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return articles, total


def increment_article_view(db: Session, article_id: int) -> None:
    db_article = get_article(db, article_id)
    if db_article:
        db_article.view_count += 1
        db.commit()


def delete_article(db: Session, article_id: int) -> bool:
    db_article = get_article(db, article_id)
    if not db_article:
        return False
    db.delete(db_article)
    db.commit()
    return True


def create_notice(db: Session, notice: NoticeCreate) -> Notice:
    db_notice = Notice(
        title=notice.title,
        content=notice.content,
        type=notice.type,
    )
    db.add(db_notice)
    db.commit()
    db.refresh(db_notice)
    return db_notice


def update_notice(db: Session, notice_id: int, notice_update: NoticeUpdate) -> Optional[Notice]:
    db_notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not db_notice:
        return None
    update_data = notice_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_notice, key, value)
    db.commit()
    db.refresh(db_notice)
    return db_notice


def get_notice_list(db: Session, type: Optional[str] = None, page: int = 1, page_size: int = 10) -> Tuple[List[Notice], int]:
    query = db.query(Notice).filter(Notice.status == 1)
    if type:
        query = query.filter(Notice.type == type)
    total = query.count()
    notices = query.order_by(Notice.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return notices, total


def delete_notice(db: Session, notice_id: int) -> bool:
    db_notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not db_notice:
        return False
    db.delete(db_notice)
    db.commit()
    return True


def create_report(db: Session, report: ReportCreate, reporter_id: int) -> Report:
    db_report = Report(
        reporter_id=reporter_id,
        target_type=report.target_type,
        target_id=report.target_id,
        reason=report.reason,
        description=report.description,
        images=report.images,
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


def update_report(db: Session, report_id: int, report_update: ReportUpdate) -> Optional[Report]:
    db_report = db.query(Report).filter(Report.id == report_id).first()
    if not db_report:
        return None
    update_data = report_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_report, key, value)
    db.commit()
    db.refresh(db_report)
    return db_report


def get_report_list(db: Session, status: Optional[str] = None, page: int = 1, page_size: int = 10) -> Tuple[List[Report], int]:
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)
    total = query.count()
    reports = query.order_by(Report.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return reports, total
