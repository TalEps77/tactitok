from fastapi import FastAPI
from api.router import api_router

# אנחנו מייבאים כלי שנקרא FileResponse, שיודע לקחת קובץ מהמחשב ולשלוח אותו לדפדפן
from fastapi.responses import FileResponse 

# הפעלת האפליקציה הרגילה
app = FastAPI(title="TactiTok API")
app.include_router(api_router)


# נתיב חדש. כשמישהו יקליד בדפדפן את הכתובת /admin
@app.get("/admin")
def get_admin_page():
    # השרת פשוט ייגש לתיקיית static, ייקח את הקובץ admin.html, ויחזיר אותו למשתמש
    return FileResponse("static/admin.html")