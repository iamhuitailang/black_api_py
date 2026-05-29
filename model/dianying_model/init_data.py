from sqlalchemy.orm import Session
from .db.database import SessionLocal, Base, engine
from .business import UserBusiness, MovieBusiness
from .models.movie import Movie

Base.metadata.create_all(bind=engine)

MOVIE_DATA = [
    {
        "title": "肖申克的救赎",
        "poster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster%20shawshank%20redemption%20prison%20dramatic&image_size=portrait_4_3",
        "year": 1994,
        "genre": "剧情,犯罪",
        "director": "弗兰克·德拉邦特",
        "actors": "蒂姆·罗宾斯,摩根·弗里曼,鲍勃·冈顿",
        "description": "一场谋杀案使银行家安迪蒙冤入狱，谋杀妻子及其情人的指控将囚禁他终生。在肖申克监狱的首次现身就让监狱“大哥”瑞德对他另眼相看。瑞德帮助他搞到一把石锤和一幅女明星海报，两人渐成患难之交。",
        "trailer": "",
        "duration": 142,
        "country": "美国"
    },
    {
        "title": "霸王别姬",
        "poster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20movie%20poster%20farewell%20my%20concubine%20beijing%20opera&image_size=portrait_4_3",
        "year": 1993,
        "genre": "剧情,爱情",
        "director": "陈凯歌",
        "actors": "张国荣,张丰毅,巩俐",
        "description": "段小楼与程蝶衣是一对打小一起长大的师兄弟，两人一个演生，一个饰旦，一向配合天衣无缝，尤其一出《霸王别姬》，更是誉满京城，为此，两人约定合演一辈子《霸王别姬》。",
        "trailer": "",
        "duration": 171,
        "country": "中国大陆,中国香港"
    },
    {
        "title": "阿甘正传",
        "poster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster%20forrest%20gump%20running%20inspiring&image_size=portrait_4_3",
        "year": 1994,
        "genre": "剧情,爱情",
        "director": "罗伯特·泽米吉斯",
        "actors": "汤姆·汉克斯,罗宾·怀特,加里·西尼斯",
        "description": "阿甘是个智商只有75的低能儿。在学校里为了躲避别的孩子的欺侮，听从一个朋友珍妮的话而开始“跑”。他跑着躲避别人的捉弄。在中学时，他为了躲避别人而跑进了一所学校的橄榄球场，就这样跑进了大学。",
        "trailer": "",
        "duration": 142,
        "country": "美国"
    },
    {
        "title": "这个杀手不太冷",
        "poster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster%20leon%20the%20professional%20hitman%20girl&image_size=portrait_4_3",
        "year": 1994,
        "genre": "剧情,动作,犯罪",
        "director": "吕克·贝松",
        "actors": "让·雷诺,娜塔莉·波特曼,加里·奥德曼",
        "description": "里昂是名孤独的职业杀手，受人雇佣。一天，邻居家小姑娘马蒂尔达敲开他的房门，要求在他那里暂避杀身之祸。原来邻居家的主人是警方缉毒组的眼线，只因贪污了一小包毒品而遭恶警杀害全家的惩罚。",
        "trailer": "",
        "duration": 110,
        "country": "法国,美国"
    },
    {
        "title": "泰坦尼克号",
        "poster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster%20titanic%20romantic%20ship%20ocean&image_size=portrait_4_3",
        "year": 1997,
        "genre": "剧情,爱情,灾难",
        "director": "詹姆斯·卡梅隆",
        "actors": "莱昂纳多·迪卡普里奥,凯特·温斯莱特,比利·赞恩",
        "description": "1912年4月10日，号称 “世界工业史上的奇迹”的豪华客轮泰坦尼克号开始了自己的处女航，从英国的南安普顿出发驶往美国纽约。富家少女罗丝与母亲及未婚夫卡尔坐上了头等舱；另一边，放荡不羁的少年画家杰克也在码头的一场赌博中赢得了下等舱的船票。",
        "trailer": "",
        "duration": 194,
        "country": "美国,墨西哥"
    },
    {
        "title": "千与千寻",
        "poster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=anime%20movie%20poster%20spirited%20away%20fantasy%20japanese&image_size=portrait_4_3",
        "year": 2001,
        "genre": "剧情,动画,奇幻",
        "director": "宫崎骏",
        "actors": "柊瑠美,入野自由,夏木真理",
        "description": "千寻和爸爸妈妈一同驱车前往新家，在郊外的小路上不慎进入了神秘的隧道——他们去到了另外一个诡异世界—一个中世纪的小镇。远处飘来食物的香味，爸爸妈妈大快朵颐，孰料之后变成了猪！",
        "trailer": "",
        "duration": 125,
        "country": "日本"
    },
    {
        "title": "星际穿越",
        "poster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster%20interstellar%20space%20universe%20sci-fi&image_size=portrait_4_3",
        "year": 2014,
        "genre": "剧情,科幻,冒险",
        "director": "克里斯托弗·诺兰",
        "actors": "马修·麦康纳,安妮·海瑟薇,杰西卡·查斯坦",
        "description": "在不久的未来，随着地球自然环境的恶化，人类面临着无法生存的威胁。这时科学家们在土星附近发现了一个虫洞出口，通往遥远的银河系。面对绝境，一群接受过特殊训练的宇航员们接受了人类历史上最为遥远的太空探索任务。",
        "trailer": "",
        "duration": 169,
        "country": "美国,英国,加拿大"
    },
    {
        "title": "盗梦空间",
        "poster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster%20inception%20dream%20mind%20thriller&image_size=portrait_4_3",
        "year": 2010,
        "genre": "剧情,科幻,悬疑",
        "director": "克里斯托弗·诺兰",
        "actors": "莱昂纳多·迪卡普里奥,约瑟夫·高登-莱维特,艾伦·佩吉",
        "description": "道姆·柯布是一位经验老道的窃贼，他在这一行业中算得上是最厉害的，因为他能够潜入人们精神最为脆弱的梦境中，窃取潜意识中有价值的秘密。柯布这一罕见的技艺使他成为危险的企业间谍活动中最令人垂涎的对象。",
        "trailer": "",
        "duration": 148,
        "country": "美国,英国"
    },
    {
        "title": "楚门的世界",
        "poster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster%20truman%20show%20reality%20tv%20satire&image_size=portrait_4_3",
        "year": 1998,
        "genre": "剧情,科幻",
        "director": "彼得·威尔",
        "actors": "金·凯瑞,艾德·哈里斯,劳拉·琳妮",
        "description": "楚门从呱呱坠地开始的三十年来，他就是肥皂剧的主角，他居住的是一个庞大的摄影棚，而他的亲朋好友和他每天碰到的人全都是职业演员。他生命中的一举一动、每分每秒都曝露在隐藏于各处的摄影镜头面前。",
        "trailer": "",
        "duration": 103,
        "country": "美国"
    },
    {
        "title": "美丽人生",
        "poster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster%20life%20is%20beautiful%20italian%20holocaust&image_size=portrait_4_3",
        "year": 1997,
        "genre": "剧情,喜剧,爱情",
        "director": "罗伯托·贝尼尼",
        "actors": "罗伯托·贝尼尼,尼可莱塔·布拉斯基,乔治·坎塔里尼",
        "description": "犹太青年圭多邂逅美丽的女教师多拉，他彬彬有礼的向多拉鞠躬：“早安！公主！”。历经诸多令人啼笑皆非的周折后，天遂人愿，两人幸福美满的生活在一起。然而好景不长，法西斯政权下，圭多和儿子被强行送往犹太人集中营。",
        "trailer": "",
        "duration": 116,
        "country": "意大利"
    },
    {
        "title": "忠犬八公的故事",
        "poster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster%20hachiko%20dog%20loyalty%20heartwarming&image_size=portrait_4_3",
        "year": 2009,
        "genre": "剧情",
        "director": "拉斯·霍尔斯道姆",
        "actors": "理查·基尔,萨拉·罗默尔,琼·艾伦",
        "description": "八公是一只谜一样的狗，因为没有人知道它从哪里来。教授帕克在小镇的火车站拣到一只走失的小狗，它似乎注定就是帕克一家的一员。帕克对小狗八公的疼爱渐渐感化了起初极力反对养狗的妻子卡特。",
        "trailer": "",
        "duration": 93,
        "country": "美国,英国"
    },
    {
        "title": "海上钢琴师",
        "poster": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=movie%20poster%20legend%20of%201900%20piano%20ocean%20ship&image_size=portrait_4_3",
        "year": 1998,
        "genre": "剧情,音乐",
        "director": "朱塞佩·托纳多雷",
        "actors": "蒂姆·罗斯,普路特·泰勒·文斯,比尔·努恩",
        "description": "1900年，Virginian号豪华邮轮上，一个孤儿被遗弃在头等舱，由船上的水手抚养长大，取名1900。1900慢慢长大，显示出了无师自通的非凡钢琴天赋，在船上的乐队表演钢琴，每个听过他演奏的人，都被深深打动。",
        "trailer": "",
        "duration": 165,
        "country": "意大利"
    }
]


def init_database():
    db: Session = SessionLocal()

    try:
        admin = UserBusiness.get_user_by_username(db, "admin")
        if not admin:
            UserBusiness.create_admin(db, username="admin", password="admin123", email="admin@dianying.com")
            print("管理员账号创建成功: admin / admin123")
        else:
            print("管理员账号已存在")

        test_user = UserBusiness.get_user_by_username(db, "user")
        if not test_user:
            UserBusiness.create_user(db, username="user", password="user123", email="user@dianying.com")
            print("测试用户账号创建成功: user / user123")
        else:
            print("测试用户账号已存在")

        for movie_data in MOVIE_DATA:
            existing = db.query(Movie).filter(Movie.title == movie_data["title"]).first()
            if not existing:
                MovieBusiness.create_movie(db, **movie_data)
                print(f"创建电影: {movie_data['title']}")
            else:
                print(f"电影已存在: {movie_data['title']}")

        print("\n数据初始化完成！")

    except Exception as e:
        print(f"初始化失败: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
