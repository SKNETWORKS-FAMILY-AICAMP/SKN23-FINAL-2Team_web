import sys
sys.path.append(".")
from backend.database import engine, Base
from backend.models import SupportTicket

def sync():
    print("Syncing DB schemas...")
    Base.metadata.create_all(bind=engine)
    print("Database synced successfully. SupportTicket table should now exist.")

if __name__ == "__main__":
    sync()
