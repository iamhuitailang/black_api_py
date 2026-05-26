import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models.task import Task


def fix_task_limits():
    db = SessionLocal()

    try:
        updates = [
            (3, 10, "day"),
            (5, 10, "day"),
            (10, 10, "day")
        ]

        for task_id, limit_count, limit_period in updates:
            task = db.query(Task).filter(Task.id == task_id).first()
            if task:
                task.limit_count = limit_count
                task.limit_period = limit_period
                print(f"✅ 更新任务 {task_id}: limit_count={limit_count}, limit_period={limit_period}")

        db.commit()
        print("\n🎉 所有任务限制已更新完成！")

    except Exception as e:
        print(f"❌ 更新失败: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    fix_task_limits()
