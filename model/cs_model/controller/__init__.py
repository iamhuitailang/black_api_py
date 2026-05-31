from .user_controller import router as user_router
from .weapon_controller import router as weapon_router
from .map_controller import router as map_router
from .game_controller import router as game_router
from .achievement_controller import router as achievement_router
from .admin_controller import router as admin_router

__all__ = ["user_router", "weapon_router", "map_router", "game_router", "achievement_router", "admin_router"]
