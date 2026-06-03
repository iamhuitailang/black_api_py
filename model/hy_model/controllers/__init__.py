from .user_controller import router as user_controller
from .submarine_controller import router as submarine_controller
from .creature_controller import router as creature_controller
from .treasure_controller import router as treasure_controller
from .equipment_controller import router as equipment_controller
from .music_controller import router as music_controller
from .ruin_controller import router as ruin_controller
from .user_collection_controller import router as user_collection_controller
from .user_progress_controller import router as user_progress_controller
from .auth_controller import router as auth_controller

__all__ = [
    "user_controller",
    "submarine_controller",
    "creature_controller",
    "treasure_controller",
    "equipment_controller",
    "music_controller",
    "ruin_controller",
    "user_collection_controller",
    "user_progress_controller",
    "auth_controller"
]
