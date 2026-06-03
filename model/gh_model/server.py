import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base
from models import *

Base.metadata.create_all(bind=engine)
print("Database tables created.")

from init_data import init_all
init_all()
print("Initial data loaded.")

import uvicorn
from main import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
