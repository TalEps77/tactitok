from core.database import engine, Base
from models import tables

def reset_database():
    print("Deleting the exist one")
    # הפקודה הזו מנקה את מסד הנתונים לחלוטין מכל הטבלאות ששייכות למודלים
    tables.Base.metadata.drop_all(bind=engine)
    
    print("Creat new one")
    # הפקודה הזו בונה אותן מחדש מאפס
    tables.Base.metadata.create_all(bind=engine)
    
    print("Ready!")

if __name__ == "__main__":
    reset_database()