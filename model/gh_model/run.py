import sys
sys.path.insert(0, '.')

from database import engine, Base
from models import User, GhostType, Location, Equipment, Task, EvidenceType

Base.metadata.create_all(bind=engine)
print("✅ Database created successfully!")

from database import SessionLocal
db = SessionLocal()

print(f"GhostTypes: {db.query(GhostType).count()}")
print(f"Locations: {db.query(Location).count()}")
print(f"Equipments: {db.query(Equipment).count()}")
print(f"EvidenceTypes: {db.query(EvidenceType).count()}")
print(f"Tasks: {db.query(Task).count()}")

db.close()
