from sqlalchemy import create_engine #מה שמחבר בין הפייתון לשרת 
from sqlalchemy.orm import sessionmaker, declarative_base #הכלי שיוצר את הפגישות הזמניות עם השרת 
#הכלי שיוצר תבנית אב לפיה נבנה את הטבלאות

#הגדרת כתובת ההתחברות למסד הנתונים
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:AmitD1303@localhost:5432/tactitok"

#יצירת מנוע התקשורת
engine = create_engine(SQLALCHEMY_DATABASE_URL)

#יצירת הכלי שמפעיל את הפגישות(Sessions)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#יצירת תבנית האב לטבלאות 
Base = declarative_base()
