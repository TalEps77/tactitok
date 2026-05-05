from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from models import tables
from schemas import interests as schemas
from core.database import get_db

router = APIRouter()

# יצירת תחום עניין חדש (POST)
@router.post("/", response_model=schemas.Interest)
def create_interest(interest: schemas.InterestCreate, db: Session = Depends(get_db)):
    db_interest = tables.Interest(**interest.model_dump())
    
    db.add(db_interest)
    db.commit()
    db.refresh(db_interest)
    return db_interest

# שליפת כל תחומי העניין (GET)
@router.get("/", response_model=List[schemas.Interest])
def get_interests(db: Session = Depends(get_db)):
    interests = db.query(tables.Interest).all()
    return interests

from uuid import UUID

# 4. עדכון תחום עניין (PUT)
@router.put("/{interest_id}", response_model=schemas.Interest)
def update_interest(interest_id: UUID, interest_update: schemas.InterestCreate, db: Session = Depends(get_db)):
    db_interest = db.query(tables.Interest).filter(tables.Interest.id == interest_id).first()
    
    if not db_interest:
        raise HTTPException(status_code=404, detail="Interest not found")

    update_data = interest_update.model_dump()
    for key, value in update_data.items():
        setattr(db_interest, key, value)

    db.commit()
    db.refresh(db_interest)
    return db_interest

# 5. מחיקת תחום עניין (DELETE)
@router.delete("/{interest_id}")
def delete_interest(interest_id: UUID, db: Session = Depends(get_db)):
    db_interest = db.query(tables.Interest).filter(tables.Interest.id == interest_id).first()
    
    if not db_interest:
        raise HTTPException(status_code=404, detail="Interest not found")
    
    db.delete(db_interest)
    db.commit()
    return {"message": "Interest deleted successfully"}