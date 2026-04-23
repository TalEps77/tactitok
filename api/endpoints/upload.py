import shutil
import os
from fastapi import APIRouter, UploadFile, File

router= APIRouter() #יצירת הראוטר

os.makedirs("uploads", exist_ok=True) #וידוא שהתיקייה קיימת

@router.post("/") #הגדרת סוג הבקשה- POST
def upload_video(file: UploadFile= File(...)):

    file_location = f"uploads/{file.filename}" #המיקום שבו הקובץ יישמר

    with open(file_location, "wb") as buffer: #פתיחת קובץ חדש בדיסק לכתיבה בתוכו בצורה בינארית

        shutil.copyfileobj(file.file, buffer) #העתקת התוכן של הסרטון לתוך הbuffer 
    
    return {"message": f"File '{file.filename} uploaded successfuliy"} #החזרת תשובה


