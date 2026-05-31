import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base, SessionLocal
from models import Idiom
from business.achievement_business import init_default_achievements
from business.idiom_business import create_idiom
from schemas import IdiomCreate

from controller.user_controller import router as user_router
from controller.idiom_controller import router as idiom_router
from controller.game_controller import router as game_router
from controller.achievement_controller import router as achievement_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="成语接龙游戏API",
    description="一个在线成语接龙游戏的后端API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(idiom_router)
app.include_router(game_router)
app.include_router(achievement_router)


@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        init_default_achievements(db)
        
        idiom_count = db.query(Idiom).count()
        if idiom_count == 0:
            sample_idioms = [
                {"word": "一心一意", "pinyin": "yi xin yi yi", "explanation": "形容做事专心一意，一门心思地只做一件事。"},
                {"word": "意气风发", "pinyin": "yi qi feng fa", "explanation": "形容精神振奋，气概豪迈。"},
                {"word": "发愤图强", "pinyin": "fa fen tu qiang", "explanation": "下定决心，努力谋求强盛或进步。"},
                {"word": "强词夺理", "pinyin": "qiang ci duo li", "explanation": "指无理强辩，明明没理硬说有理。"},
                {"word": "理直气壮", "pinyin": "li zhi qi zhuang", "explanation": "理由充分，因而说话做事有气势或心里无愧，无所畏惧。"},
                {"word": "壮志凌云", "pinyin": "zhuang zhi ling yun", "explanation": "形容理想宏伟远大。"},
                {"word": "云开见日", "pinyin": "yun kai jian ri", "explanation": "比喻黑暗已经过去，光明已经到来。"},
                {"word": "日新月异", "pinyin": "ri xin yue yi", "explanation": "每天都在更新，每月都有变化。指发展或进步迅速，不断出现新事物、新气象。"},
                {"word": "异想天开", "pinyin": "yi xiang tian kai", "explanation": "指想法很不切实际，非常奇怪。"},
                {"word": "开门见山", "pinyin": "kai men jian shan", "explanation": "比喻说话或写文章直截了当，不拐弯抹角。"},
                {"word": "山高水长", "pinyin": "shan gao shui chang", "explanation": "原比喻人的风范或声誉像高山一样永远存在。后比喻恩德深厚。"},
                {"word": "长驱直入", "pinyin": "chang qu zhi ru", "explanation": "指长距离不停顿的快速行进。形容进军迅猛，不可阻挡。"},
                {"word": "入木三分", "pinyin": "ru mu san fen", "explanation": "形容书法极有笔力。现多比喻分析问题很深刻。"},
                {"word": "分秒必争", "pinyin": "fen miao bi zheng", "explanation": "一分一秒也一定要争取。形容抓紧时间。"},
                {"word": "争先恐后", "pinyin": "zheng xian kong hou", "explanation": "抢着向前，唯恐落后。"},
                {"word": "后来居上", "pinyin": "hou lai ju shang", "explanation": "后来的超过先前的。用以称赞后起之秀超过前辈。"},
                {"word": "上善若水", "pinyin": "shang shan ruo shui", "explanation": "最高的善像水那样。水善于帮助万物而不与万物相争。"},
                {"word": "水到渠成", "pinyin": "shui dao qu cheng", "explanation": "水流到的地方自然形成一条水道。比喻条件成熟，事情自然会成功。"},
                {"word": "成竹在胸", "pinyin": "cheng zhu zai xiong", "explanation": "画竹子前竹子的完整形象已在胸中。比喻做事之前已有通盘的考虑。"},
                {"word": "胸有成竹", "pinyin": "xiong you cheng zhu", "explanation": "比喻在做事之前已经拿定主意。"},
            ]
            
            for idiom_data in sample_idioms:
                create_idiom(db, IdiomCreate(**idiom_data))
                
    except Exception as e:
        print(f"初始化数据时出错: {e}")
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "欢迎使用成语接龙游戏API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
