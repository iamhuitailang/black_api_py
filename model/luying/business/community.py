from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import Post, Comment, Like, Follow, User
from schemas import PostCreate, PostUpdate, CommentCreate, LikeCreate, FollowCreate
from datetime import datetime


def create_post(db: Session, post: PostCreate, user_id: int) -> Post:
    db_post = Post(
        user_id=user_id,
        title=post.title,
        content=post.content,
        images=post.images,
        location=post.location,
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post


def get_post_by_id(db: Session, post_id: int) -> Post:
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if db_post:
        try:
            db_post.view_count = (db_post.view_count or 0) + 1
            db.commit()
            db.refresh(db_post)
        except Exception:
            db.rollback()
    return db_post


def get_post_list(db: Session, page: int = 1, page_size: int = 10, keyword: str = None, user_id: int = None) -> dict:
    query = db.query(Post).filter(Post.status == 1)
    if keyword:
        query = query.filter(or_(Post.title.contains(keyword), Post.content.contains(keyword)))
    if user_id:
        query = query.filter(Post.user_id == user_id)
    total = query.count()
    items = query.order_by(Post.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


def update_post(db: Session, post_id: int, post_update: PostUpdate) -> Post:
    db_post = get_post_by_id(db, post_id)
    if not db_post:
        return None
    update_data = post_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_post, key, value)
    db_post.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_post)
    return db_post


def delete_post(db: Session, post_id: int) -> bool:
    db_post = get_post_by_id(db, post_id)
    if not db_post:
        return False
    db_post.status = 0
    db.commit()
    return True


def create_comment(db: Session, comment: CommentCreate, user_id: int) -> Comment:
    db_comment = Comment(
        post_id=comment.post_id,
        user_id=user_id,
        content=comment.content,
        parent_id=comment.parent_id,
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


def get_comments_by_post(db: Session, post_id: int) -> list:
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
    return comments


def delete_comment(db: Session, comment_id: int) -> bool:
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment:
        return False
    db.delete(db_comment)
    db.commit()
    return True


def create_like(db: Session, post_id: int, user_id: int) -> bool:
    db_like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == user_id
    ).first()
    if db_like:
        db.delete(db_like)
        db.commit()
        return False
    db_like = Like(
        post_id=post_id,
        user_id=user_id,
    )
    db.add(db_like)
    db.commit()
    return True


def is_liked(db: Session, post_id: int, user_id: int) -> bool:
    return db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == user_id
    ).first() is not None


def get_post_like_count(db: Session, post_id: int) -> int:
    return db.query(Like).filter(Like.post_id == post_id).count()


def create_follow(db: Session, following_id: int, user_id: int) -> bool:
    if following_id == user_id:
        return False
    db_follow = db.query(Follow).filter(
        Follow.follower_id == user_id,
        Follow.following_id == following_id
    ).first()
    if db_follow:
        db.delete(db_follow)
        db.commit()
        return False
    db_follow = Follow(
        follower_id=user_id,
        following_id=following_id,
    )
    db.add(db_follow)
    db.commit()
    return True


def is_following(db: Session, following_id: int, user_id: int) -> bool:
    return db.query(Follow).filter(
        Follow.follower_id == user_id,
        Follow.following_id == following_id
    ).first() is not None


def get_user_followers(db: Session, user_id: int) -> list:
    followers = db.query(User).join(Follow, Follow.follower_id == User.id).filter(
        Follow.following_id == user_id
    ).all()
    return followers


def get_user_following(db: Session, user_id: int) -> list:
    following = db.query(User).join(Follow, Follow.following_id == User.id).filter(
        Follow.follower_id == user_id
    ).all()
    return following


def post_to_dict(post: Post, current_user_id: int = None) -> dict:
    like_count = len(post.likes) if post.likes else 0
    data = {
        "id": post.id,
        "user_id": post.user_id,
        "username": post.user.username if post.user else None,
        "nickname": post.user.nickname if post.user else None,
        "avatar": post.user.avatar if post.user else None,
        "title": post.title,
        "content": post.content,
        "images": post.images,
        "location": post.location,
        "view_count": post.view_count,
        "like_count": like_count,
        "comment_count": len(post.comments) if post.comments else 0,
        "status": post.status,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "updated_at": post.updated_at.isoformat() if post.updated_at else None,
    }
    if current_user_id:
        data["is_liked"] = any(like.user_id == current_user_id for like in (post.likes or []))
    return data


def comment_to_dict(comment: Comment) -> dict:
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "user_id": comment.user_id,
        "username": comment.user.username if comment.user else None,
        "nickname": comment.user.nickname if comment.user else None,
        "avatar": comment.user.avatar if comment.user else None,
        "content": comment.content,
        "parent_id": comment.parent_id,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
    }


def user_to_simple_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "avatar": user.avatar,
        "bio": user.bio,
    }
