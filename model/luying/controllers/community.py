from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from schemas import PostCreate, PostUpdate, CommentCreate, success_response, error_response
from business import community as community_business

router = APIRouter(prefix="/api/community", tags=["社区互动"])


@router.post("/post/create")
def create_post(post: PostCreate, user_id: int, db: Session = Depends(get_db)):
    if not post.title:
        return error_response("标题不能为空")
    db_post = community_business.create_post(db, post, user_id)
    return success_response(community_business.post_to_dict(db_post), "发布成功")


@router.get("/post/list")
def get_post_list(
    page: int = 1,
    page_size: int = 10,
    keyword: Optional[str] = None,
    user_id: Optional[int] = None,
    current_user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    result = community_business.get_post_list(db, page, page_size, keyword, user_id)
    return success_response({
        "total": result["total"],
        "items": [community_business.post_to_dict(p, current_user_id) for p in result["items"]]
    })


@router.get("/post/{post_id}")
def get_post_detail(post_id: int, current_user_id: Optional[int] = None, db: Session = Depends(get_db)):
    db_post = community_business.get_post_by_id(db, post_id)
    if not db_post:
        return error_response("帖子不存在")
    return success_response(community_business.post_to_dict(db_post, current_user_id))


@router.put("/post/{post_id}")
def update_post(post_id: int, post_update: PostUpdate, db: Session = Depends(get_db)):
    db_post = community_business.update_post(db, post_id, post_update)
    if not db_post:
        return error_response("帖子不存在")
    return success_response(community_business.post_to_dict(db_post), "更新成功")


@router.delete("/post/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db)):
    success = community_business.delete_post(db, post_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")


@router.post("/comment")
def create_comment(comment: CommentCreate, user_id: int, db: Session = Depends(get_db)):
    if not comment.content:
        return error_response("评论内容不能为空")
    db_comment = community_business.create_comment(db, comment, user_id)
    return success_response(community_business.comment_to_dict(db_comment), "评论成功")


@router.get("/comment/list/{post_id}")
def get_comments(post_id: int, db: Session = Depends(get_db)):
    comments = community_business.get_comments_by_post(db, post_id)
    return success_response([community_business.comment_to_dict(c) for c in comments])


@router.delete("/comment/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    success = community_business.delete_comment(db, comment_id)
    if not success:
        return error_response("删除失败")
    return success_response(None, "删除成功")


@router.post("/like")
def toggle_like(post_id: int, user_id: int, db: Session = Depends(get_db)):
    liked = community_business.create_like(db, post_id, user_id)
    if liked:
        return success_response({"is_liked": True}, "点赞成功")
    else:
        return success_response({"is_liked": False}, "取消点赞成功")


@router.post("/follow")
def toggle_follow(following_id: int, user_id: int, db: Session = Depends(get_db)):
    followed = community_business.create_follow(db, following_id, user_id)
    if followed:
        return success_response({"is_following": True}, "关注成功")
    else:
        return success_response({"is_following": False}, "取消关注成功")


@router.get("/follow/followers/{user_id}")
def get_user_followers(user_id: int, db: Session = Depends(get_db)):
    followers = community_business.get_user_followers(db, user_id)
    return success_response([community_business.user_to_simple_dict(u) for u in followers])


@router.get("/follow/following/{user_id}")
def get_user_following(user_id: int, db: Session = Depends(get_db)):
    following = community_business.get_user_following(db, user_id)
    return success_response([community_business.user_to_simple_dict(u) for u in following])
