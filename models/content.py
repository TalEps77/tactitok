#יצירת הטבלאות עבוד מסד הנתונים
from sqlalchemy import Column, Integer #ייבוא של עמודות מסוג Int
from core.database import Base #ייבוא מחלקת האב

#יצירת טבלת קטגוריות
class Catagory(Base):
    __tablename__="catagories"
    #עמודת זיהוי
    id= Column(Integer, primary_key=True, index=True)

#טבלת תחומי עניין
class Interest(Base):
    __tablename__="interests"

    id=Column(Integer, primary_key=True, index=True)

#טבלת תוכן
class Content(Base):
    __tablename__="content"

    id=Column(Integer, primary_key=True, index=True)
