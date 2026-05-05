from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from models import tables
from schemas import categories as schemas
from core.database import get_db

# 1. הגדרת הראוטר
router = APIRouter()

# 2. ראוט ליצירת קטגוריה חדשה (POST)
@router.post("/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    # שלב א': המרה מ-Pydantic ל-SQLAlchemy
    db_category = tables.Category(**category.model_dump())
    
    # שלב ב': הוספה למסד הנתונים
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    # שלב ג': החזרת התשובה
    return db_category

# 3. ראוט לקריאת כל הקטגוריות (GET)
@router.get("/", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(tables.Category).all()
    return categories

# 4. עדכון קטגוריה (PUT)
@router.put("/{category_id}", response_model=schemas.Category)
def update_category(category_id: UUID, category_update: schemas.CategoryCreate, db: Session = Depends(get_db)):
    # חיפוש הקטגוריה במסד הנתונים
    db_category = db.query(tables.Category).filter(tables.Category.id == category_id).first()
    
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    # עדכון השדות
    update_data = category_update.model_dump()
    for key, value in update_data.items():
        setattr(db_category, key, value)

    db.commit()
    db.refresh(db_category)
    return db_category

# 5. מחיקת קטגוריה (DELETE)
@router.delete("/{category_id}")
def delete_category(category_id: UUID, db: Session = Depends(get_db)):
    db_category = db.query(tables.Category).filter(tables.Category.id == category_id).first()
    
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(db_category)
    db.commit()
    return {"message": "Category deleted successfully"}