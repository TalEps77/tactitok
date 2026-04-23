let catalogData = [];

const API_URL = "https://gist.githubusercontent.com/ron-dikstein/256eb35ca452eeb486e17a6dca111c75/raw/c9a9bf608d9f7355249d3c5cedaa747843d2449b/catalog.json";

// פונקציה שרצה כשהדף נטען ומציגה את הקבצים
function renderLibrary(dataToDisplay) {
    const container = document.getElementById('tt-cats');
    if (!container) return;
    
    container.innerHTML = ''; // מנקה את התצוגה הנוכחית

    dataToDisplay.forEach(item => {
        const card = document.createElement('div');
        card.className = 'tt-card';
        card.innerHTML = `
            <div class="tt-card-thumb tt-card-${item.type.toLowerCase()}">${item.type}</div>
            <div class="tt-card-info">
                <div class="tt-card-title">${item.title}</div>
                <div class="tt-card-meta">${item.type === 'VID' ? item.duration : item.pages + ' עמודים'} · ${item.category}</div>
            </div>
            <button class="tt-dl-btn">↓</button>
        `;
        container.appendChild(card);
        card.onclick = () => openModal(item.id);
    });
}

function ttSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    
    // סינון של catalogData (הנתונים מה-fetch) במקום mockData
    const filteredData = catalogData.filter(item => {
        return item.title.toLowerCase().includes(searchTerm) || 
               item.category.toLowerCase().includes(searchTerm);
    });

    renderLibrary(filteredData);
}

function openModal(itemId) {
    // שינוי כאן: מחליפים את mockData ב-catalogData
    const item = catalogData.find(i => i.id === itemId); 
    
    if (!item) return;

    const modal = document.getElementById('contentModal');
    const container = document.getElementById('playerContainer');
    const title = document.getElementById('modalTitle');

    title.textContent = item.title;
    container.innerHTML = '';

    if (item.type === 'VID') {
        container.innerHTML = `
            <video controls autoplay style="width:100%; border-radius:8px;">
                <source src="${item.url}" type="video/mp4">
            </video>`;
    } else if (item.type === 'PDF') {
        container.innerHTML = `
            <iframe src="${item.url}" style="width:100%; height:400px; border:none;"></iframe>`;
    }

    modal.classList.remove('hidden');
}

// פונקציה לסגירת הנגן
function closeModal() {
    const modal = document.getElementById('contentModal');
    const container = document.getElementById('playerContainer');
    
    container.innerHTML = ''; // עוצר את הוידאו כשסוגרים את החלון
    modal.classList.add('hidden');
}

function handleRefresh() {
    console.log("מרענן קטלוג...");
    
    // ניקוי תיבת החיפוש כדי לראות את כל התוצאות מחדש
    document.querySelector('.tt-search').value = '';
    
    // טעינת הנתונים (כרגע מהזכרון, בקרוב מהשרת)
   fetchCatalog();
    
    // בונוס: אפקט ויזואלי קטן של הצלחה
    alert("הקטלוג עודכן בהצלחה!"); 
}

async function fetchCatalog() {
    try {
        console.log("מבצע פניית רשת למקור חיצוני...");
        const response = await fetch(API_URL);
        
        if (!response.ok) throw new Error("השרת החיצוני החזיר שגיאה");
        
        catalogData = await response.json(); 
        console.log("נתונים הגיעו בהצלחה:", catalogData);
        renderLibrary(catalogData);
    } catch (error) {
        console.error("שגיאת רשת:", error);
        alert("נכשלנו במשיכת נתונים מ-GitHub. בדוק את ה-Console.");
    }
}

// קוראים לפונקציה ברגע שהדף נטען
document.addEventListener('DOMContentLoaded', fetchCatalog);

window.onclick = function(event) {
    const modal = document.getElementById('contentModal');
    if (event.target == modal) {
        closeModal();
    }
}
