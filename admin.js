const uploadForm = document.getElementById('uploadForm');
const statusMessage = document.getElementById('statusMessage');
const contentFile = document.getElementById('contentFile');
const filePreview = document.getElementById('filePreview');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const removeFileBtn = document.getElementById('removeFileBtn');
const titleInput = document.getElementById('title'); 

// פונקציה לניקוי הודעת הסטטוס
function clearStatus() {
    statusMessage.textContent = "";
}

// :ניהול תצוגת הקובץ והמחיקה שלו 

// ברגע שהמשתמש בחר קובץ
contentFile.addEventListener('change', function() {
    clearStatus();
    if (this.files && this.files.length > 0) {
        fileNameDisplay.textContent = this.files[0].name; 
        contentFile.classList.add('hidden'); 
        filePreview.classList.remove('hidden'); 
    }
});

// ברגע שהמשתמש לוחץ על האיקס לביטול
removeFileBtn.addEventListener('click', function() {
    clearStatus();
    contentFile.value = ''; // איפוס בחירת הקובץ
    filePreview.classList.add('hidden'); 
    contentFile.classList.remove('hidden'); 
});

// מנקה את ההודעה כשהמשתמש מתחיל להקליד כותרת חדשה
titleInput.addEventListener('input', clearStatus);

//  טיפול בשליחת הטופס לשרת 

uploadForm.addEventListener('submit', async function(event) {
    event.preventDefault(); // עוצר את ריענון הדף 

    statusMessage.textContent = "מעלה קובץ, אנא המתן...";
    statusMessage.style.color = "black"; 

    const formData = new FormData(uploadForm);

    try {
        const response = await fetch('https://httpbin.org/post', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            statusMessage.textContent = "הקובץ עלה בהצלחה!";
            statusMessage.style.color = "green";
            
            // איפוס הטופס וחזרה למצב התחלתי
            uploadForm.reset(); 
            filePreview.classList.add('hidden');
            contentFile.classList.remove('hidden');
            
        } else {
            statusMessage.textContent = "שגיאה בהעלאה. השרת החזיר סטטוס: " + response.status;
            statusMessage.style.color = "red";
        }
    } catch (error) {
        statusMessage.textContent = "שגיאת תקשורת: לא ניתן להגיע לשרת.";
        statusMessage.style.color = "red";
    }
});