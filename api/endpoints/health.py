from fastapi import APIRouter

#יצירת ראוטר מקומי שאחראי רק על בדיקת תקינות
router=APIRouter()

#פעולה שתרוץ כאשר מישהו שלח פקודת GET
@router.get("/")
def health_check():
    #הפעולה מחזירה מילון עם הודעת הצלחה (פורמט JASON)
    return {"status": "OK", "message": "TactiTok API is running"}
