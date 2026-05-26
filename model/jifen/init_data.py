import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Category, Product, Task, User
from utils.auth import hash_password


def init_data():
    db = SessionLocal()

    try:
        if db.query(Category).count() == 0:
            categories = [
                Category(id=1, name="虚拟商品", icon="🎫", description="优惠券/会员/皮肤/勋章", sort=1),
                Category(id=2, name="实体周边", icon="🧸", description="贴纸/钥匙扣/公仔/T恤", sort=2),
                Category(id=3, name="游戏道具", icon="🎮", description="游戏内货币/皮肤/礼包", sort=3),
                Category(id=4, name="课程内容", icon="📚", description="电子书/课程兑换码", sort=4),
                Category(id=5, name="抽奖", icon="🎲", description="盲盒/扭蛋", sort=5),
            ]
            db.add_all(categories)
            db.commit()
            print("✅ 分类数据初始化完成")

        if db.query(Product).count() == 0:
            products = [
                Product(id=1, category_id=1, name="9折优惠券（满100可用）", description="满100元可用的9折优惠券", image="", price=80, stock=999, total_stock=999, is_hot=True, is_virtual=True, limit_type="day", limit_count=1, sort=10),
                Product(id=2, category_id=1, name="8折优惠券（满200可用）", description="满200元可用的8折优惠券", image="", price=150, stock=999, total_stock=999, is_hot=True, is_virtual=True, limit_type="day", limit_count=1, sort=9),
                Product(id=3, category_id=1, name="7折优惠券（满500可用）", description="满500元可用的7折优惠券", image="", price=300, stock=999, total_stock=999, is_hot=False, is_virtual=True, limit_type="week", limit_count=1, sort=8),
                Product(id=4, category_id=1, name="商城专属边框（30天）", description="30天有效期的商城专属头像边框", image="", price=200, stock=9999, total_stock=9999, is_hot=True, is_virtual=True, limit_type="month", limit_count=1, sort=7),
                Product(id=5, category_id=1, name="专属勋章\"打卡达人\"", description="终身专属勋章，彰显打卡达人身份", image="", price=500, stock=9999, total_stock=9999, is_hot=True, is_virtual=True, limit_type="lifetime", limit_count=1, sort=6),
                Product(id=6, category_id=1, name="宠物头像挂件", description="可爱的宠物头像挂件", image="", price=100, stock=9999, total_stock=9999, is_hot=False, is_virtual=True, limit_type="month", limit_count=1, sort=5),
                Product(id=7, category_id=2, name="贴纸包（实体邮寄）", description="精美贴纸包，实体邮寄到家", image="", price=200, stock=50, total_stock=50, is_hot=True, is_virtual=False, limit_type="none", limit_count=0, sort=10),
                Product(id=8, category_id=2, name="钥匙扣盲盒", description="随机款式钥匙扣，惊喜满满", image="", price=350, stock=30, total_stock=30, is_hot=True, is_virtual=False, limit_type="none", limit_count=0, sort=9),
                Product(id=9, category_id=2, name="定制徽章", description="专属定制徽章", image="", price=500, stock=20, total_stock=20, is_hot=False, is_virtual=False, limit_type="none", limit_count=0, sort=8),
                Product(id=10, category_id=2, name="帆布袋", description="环保帆布袋，实用又好看", image="", price=800, stock=15, total_stock=15, is_hot=True, is_virtual=False, limit_type="none", limit_count=0, sort=7),
                Product(id=11, category_id=2, name="毛绒公仔（小号）", description="可爱的毛绒公仔，小号款", image="", price=1200, stock=10, total_stock=10, is_hot=True, is_virtual=False, limit_type="none", limit_count=0, sort=6),
                Product(id=12, category_id=2, name="T恤（定制图案）", description="可定制图案的T恤", image="", price=1500, stock=10, total_stock=10, is_hot=False, is_virtual=False, limit_type="none", limit_count=0, sort=5),
                Product(id=13, category_id=2, name="马克杯", description="精美马克杯，每日必备", image="", price=600, stock=20, total_stock=20, is_hot=True, is_virtual=False, limit_type="none", limit_count=0, sort=4),
                Product(id=14, category_id=3, name="游戏金币包（1000）", description="内含1000游戏金币", image="", price=100, stock=999, total_stock=999, is_hot=True, is_virtual=True, limit_type="day", limit_count=1, sort=10),
                Product(id=15, category_id=3, name="游戏道具-经验加倍卡", description="经验获取翻倍，快速升级", image="", price=200, stock=999, total_stock=999, is_hot=False, is_virtual=True, limit_type="week", limit_count=3, sort=9),
                Product(id=16, category_id=3, name="游戏限定皮肤（7天）", description="7天有效期的游戏限定皮肤", image="", price=300, stock=9999, total_stock=9999, is_hot=True, is_virtual=True, limit_type="week", limit_count=1, sort=8),
                Product(id=17, category_id=4, name="《养宠指南》电子书", description="全面的养宠知识指南", image="", price=300, stock=9999, total_stock=9999, is_hot=False, is_virtual=True, limit_type="none", limit_count=0, sort=10),
                Product(id=18, category_id=4, name="宠物训练视频课", description="专业宠物训练视频课程", image="", price=800, stock=9999, total_stock=9999, is_hot=True, is_virtual=True, limit_type="none", limit_count=0, sort=9),
                Product(id=19, category_id=5, name="幸运的扭蛋", description="随机获得50-500积分", image="", price=50, stock=9999, total_stock=9999, is_hot=True, is_virtual=True, limit_type="day", limit_count=3, sort=10),
                Product(id=20, category_id=5, name="超级盲盒", description="随机获得价值100-2000积分的商品", image="", price=200, stock=9999, total_stock=9999, is_hot=True, is_virtual=True, limit_type="day", limit_count=1, sort=9),
            ]
            db.add_all(products)
            db.commit()
            print("✅ 商品数据初始化完成")

        if db.query(Task).count() == 0:
            tasks = [
                Task(id=1, name="每日签到", description="每日签到获得积分", icon="📅", points=10, type="daily", limit_count=1, limit_period="day", sort=1),
                Task(id=2, name="完善个人资料", description="首次完善个人资料", icon="📝", points=30, type="once", limit_count=1, limit_period="lifetime", sort=2),
                Task(id=3, name="添加宠物档案", description="添加新的宠物档案", icon="🐾", points=20, type="daily", limit_count=10, limit_period="day", sort=3),
                Task(id=4, name="记录体重", description="每日首次记录体重", icon="⚖️", points=5, type="daily", limit_count=1, limit_period="day", sort=4),
                Task(id=5, name="完成驱虫记录", description="每次记录驱虫获得积分", icon="💊", points=15, type="daily", limit_count=10, limit_period="day", sort=5),
                Task(id=6, name="发布成长日记", description="发布成长日记获得积分", icon="📔", points=10, type="daily", limit_count=3, limit_period="day", sort=6),
                Task(id=7, name="上传照片", description="上传照片获得积分", icon="📷", points=5, type="daily", limit_count=5, limit_period="day", sort=7),
                Task(id=8, name="分享商城", description="点击分享按钮获得积分", icon="🔗", points=5, type="daily", limit_count=1, limit_period="day", sort=8),
                Task(id=9, name="连续登录7天", description="连续登录7天获得奖励", icon="🏆", points=100, type="weekly", limit_count=1, limit_period="week", sort=9),
                Task(id=10, name="邀请好友", description="邀请好友首次登录", icon="👥", points=200, type="daily", limit_count=10, limit_period="day", sort=10),
            ]
            db.add_all(tasks)
            db.commit()
            print("✅ 任务数据初始化完成")

        if not db.query(User).filter(User.role == "admin").first():
            admin = User(
                username="admin",
                password=hash_password("admin123"),
                nickname="管理员",
                role="admin",
                invite_code="ADMIN00"
            )
            db.add(admin)
            db.commit()
            print("✅ 管理员账号创建完成 (admin/admin123)")

        print("\n🎉 所有数据初始化完成！")
        print("📌 默认管理员账号: admin / admin123")

    except Exception as e:
        print(f"❌ 初始化失败: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_data()
