from .user_controller import router as user_router
from .movie_controller import router as movie_router
from .rating_controller import router as rating_router
from .favorite_controller import router as favorite_router
from .stats_controller import router as stats_router

__all__ = ["user_router", "movie_router", "rating_router", "favorite_router", "stats_router"]
