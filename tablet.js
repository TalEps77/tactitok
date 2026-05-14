let catalogData = [];
let currentSearchTerm = "";

// הגדרת ה-Worker של PDF.js
if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

function api() {
    if (!window.TactiTokAPI) {
        throw new Error("api.js לא נטען. ודא שקובץ api.js קיים ונטען לפני tablet.js");
    }

    return window.TactiTokAPI;
}

function getApiBase() {
    const base = window.TACTITOK_API_BASE || "/api";
    return String(base).replace(/\/+$/, "");
}

function joinApiPath(path) {
    const base = getApiBase();
    const cleanPath = String(path || "").replace(/^\/+/, "");

    if (!base) {
        return "/" + cleanPath;
    }

    return base + "/" + cleanPath;
}

function normalizeList(response, possibleKeys = ["items", "data", "results", "catalog"]) {
    if (Array.isArray(response)) {
        return response;
    }

    if (!response || typeof response !== "object") {
        return [];
    }

    for (const key of possibleKeys) {
        if (Array.isArray(response[key])) {
            return response[key];
        }
    }

    return [];
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getItemId(item) {
    return item?.id ?? item?._id ?? item?.uuid ?? "";
}

function getItemTitle(item) {
    return item?.title ?? item?.name ?? "ללא כותרת";
}

function getItemDescription(item) {
    return item?.description ?? "";
}

function getItemTypeRaw(item) {
    return item?.type ?? item?.content_type ?? item?.file_type ?? "";
}

function getDisplayType(item) {
    const type = String(getItemTypeRaw(item)).toLowerCase();

    if (
        type === "vid" ||
        type === "video" ||
        type === "mp4" ||
        type.includes("video")
    ) {
        return "VID";
    }

    if (
        type === "pdf" ||
        type.includes("pdf") ||
        type === "application/pdf"
    ) {
        return "PDF";
    }

    return String(getItemTypeRaw(item) || "FILE").toUpperCase();
}

function isVideo(item) {
    return getDisplayType(item) === "VID";
}

function isPdf(item) {
    return getDisplayType(item) === "PDF";
}

function getItemCategory(item) {
    if (!item) return "";

    if (typeof item.category === "object" && item.category !== null) {
        return item.category.name ?? item.category.title ?? "";
    }

    return item.category ?? item.category_name ?? "";
}

function getItemInterests(item) {
    const rawInterests = item?.interests ?? item?.interest_names ?? [];

    if (Array.isArray(rawInterests)) {
        return rawInterests.map(interest => {
            if (typeof interest === "object" && interest !== null) {
                return interest.name ?? interest.title ?? "";
            }

            return String(interest);
        }).filter(Boolean);
    }

    if (typeof rawInterests === "string") {
        return rawInterests
            .split(",")
            .map(value => value.trim())
            .filter(Boolean);
    }

    return [];
}

function getItemDuration(item) {
    return item?.duration ?? item?.video_duration ?? "";
}

function getItemPages(item) {
    return item?.pages ?? item?.page_count ?? "";
}

function getItemMetaText(item) {
    const category = getItemCategory(item);
    const duration = getItemDuration(item);
    const pages = getItemPages(item);

    if (isVideo(item) && duration) {
        return `${duration} · ${category}`;
    }

    if (isPdf(item) && pages) {
        return `${pages} עמודים · ${category}`;
    }

    return category || "ללא קטגוריה";
}

function getItemFileUrl(item) {
    const rawUrl =
        item?.fileUrl ??
        item?.file_url ??
        item?.url ??
        item?.file ??
        item?.path ??
        "";

    if (rawUrl) {
        const url = String(rawUrl);

        if (
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("//")
        ) {
            return url;
        }

        if (url.startsWith("/api/")) {
            return url;
        }

        if (url.startsWith("/")) {
            return joinApiPath(url);
        }

        return joinApiPath(url);
    }

    const id = getItemId(item);

    if (!id) {
        return "";
    }

    return joinApiPath(`content/${encodeURIComponent(id)}/file`);
}

// פונקציה שמציגה את הקבצים בספרייה
function renderLibrary(dataToDisplay) {
    const container = document.getElementById('tt-cats');
    if (!container) return;
    
    container.innerHTML = '';

    if (!dataToDisplay || dataToDisplay.length === 0) {
        container.innerHTML = `
            <div class="tt-card">
                <div class="tt-card-info">
                    <div class="tt-card-title">לא נמצאו תכנים להצגה</div>
                    <div class="tt-card-meta">נסה לרענן או לשנות את החיפוש</div>
                </div>
            </div>
        `;
        return;
    }

    dataToDisplay.forEach(item => {
        const id = getItemId(item);
        const title = getItemTitle(item);
        const type = getDisplayType(item);
        const metaText = getItemMetaText(item);
        const cssType = type === "VID" ? "vid" : "pdf";

        const card = document.createElement('div');
        card.className = 'tt-card';

        card.innerHTML = `
            <div class="tt-card-thumb tt-card-${cssType}">${escapeHtml(type)}</div>
            <div class="tt-card-info">
                <div class="tt-card-title">${escapeHtml(title)}</div>
                <div class="tt-card-meta">${escapeHtml(metaText)}</div>
            </div>
            <button class="tt-dl-btn" title="הורדה">↓</button>
        `;

        card.addEventListener('click', function() {
            openModal(id);
        });

        const downloadButton = card.querySelector('.tt-dl-btn');
        downloadButton.addEventListener('click', function(event) {
            event.stopPropagation();
            handleDownloadClick(item);
        });

        container.appendChild(card);
    });
}

function filterCatalogBySearch(query) {
    const searchTerm = String(query || "").toLowerCase().trim();

    if (!searchTerm) {
        return catalogData;
    }

    return catalogData.filter(item => {
        const title = getItemTitle(item).toLowerCase();
        const description = getItemDescription(item).toLowerCase();
        const category = getItemCategory(item).toLowerCase();
        const interests = getItemInterests(item).join(" ").toLowerCase();

        return (
            title.includes(searchTerm) ||
            description.includes(searchTerm) ||
            category.includes(searchTerm) ||
            interests.includes(searchTerm)
        );
    });
}

function ttSearch(query) {
    currentSearchTerm = query;
    const filteredData = filterCatalogBySearch(query);
    renderLibrary(filteredData);
}

async function openModal(itemId) {
    const item = catalogData.find(currentItem => {
        return String(getItemId(currentItem)) === String(itemId);
    });

    if (!item) return;

    const modal = document.getElementById('contentModal');
    const container = document.getElementById('playerContainer');
    const title = document.getElementById('modalTitle');

    const fileUrl = getItemFileUrl(item);

    title.textContent = getItemTitle(item);
    container.innerHTML = '';

    if (!fileUrl) {
        container.innerHTML = '<p style="color:red;">לא נמצא קישור לקובץ.</p>';
        modal.classList.remove('hidden');
        return;
    }

    if (isVideo(item)) {
        const video = document.createElement('video');
        video.controls = true;
        video.autoplay = true;
        video.style.width = "100%";
        video.style.borderRadius = "8px";

        const source = document.createElement('source');
        source.src = fileUrl;
        source.type = "video/mp4";

        video.appendChild(source);
        container.appendChild(video);
    } 
    else if (isPdf(item)) {
        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        container.appendChild(canvas);

        try {
            const loadingTask = pdfjsLib.getDocument(fileUrl);
            const pdf = await loadingTask.promise;
            
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.5 });
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            await page.render(renderContext).promise;
            console.log('PDF rendered successfully via PDF.js');
        } catch (error) {
            console.error('Error rendering PDF:', error);
            container.innerHTML = '<p style="color:red;">שגיאה בטעינת המסמך. בדוק שהקובץ זמין דרך nginx ושאין חסימת CORS.</p>';
        }
    }
    else {
        container.innerHTML = `
            <p>סוג הקובץ אינו נתמך לתצוגה מקדימה.</p>
            <a href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener">פתח קובץ</a>
        `;
    }

    modal.classList.remove('hidden');
}

// פונקציה לסגירת הנגן
function closeModal() {
    const modal = document.getElementById('contentModal');
    const container = document.getElementById('playerContainer');
    
    container.innerHTML = '';
    modal.classList.add('hidden');
}

async function handleRefresh() {
    console.log("מרענן קטלוג...");

    const searchInput = document.querySelector('.tt-search');

    if (searchInput) {
        searchInput.value = '';
    }

    currentSearchTerm = '';

    await fetchCatalog(true);
}

function handleDownloadClick(item) {
    console.log("Download clicked:", item);

    alert("מנגנון ההורדות המלא יפותח בספרינט 4. כרגע הקובץ נטען דרך nginx.");
}

async function fetchCatalog(showSuccessAlert = false) {
    const container = document.getElementById('tt-cats');

    try {
        console.log("מבצע טעינת קטלוג מה-API...");

        if (container) {
            container.innerHTML = `
                <div class="tt-card">
                    <div class="tt-card-info">
                        <div class="tt-card-title">טוען קטלוג...</div>
                        <div class="tt-card-meta">מתחבר לשרת</div>
                    </div>
                </div>
            `;
        }

        const response = await api().getCatalog();
        catalogData = normalizeList(response, ["items", "data", "results", "catalog"]);

        console.log("קטלוג נטען בהצלחה:", catalogData);

        const filteredData = filterCatalogBySearch(currentSearchTerm);
        renderLibrary(filteredData);

        if (showSuccessAlert) {
            alert("הקטלוג עודכן בהצלחה!");
        }
    } catch (error) {
        console.error("שגיאת רשת בטעינת קטלוג:", error);

        if (container) {
            container.innerHTML = `
                <div class="tt-card">
                    <div class="tt-card-info">
                        <div class="tt-card-title" style="color:red;">שגיאה בטעינת הקטלוג</div>
                        <div class="tt-card-meta">${escapeHtml(error.message)}</div>
                    </div>
                </div>
            `;
        }

        if (showSuccessAlert) {
            alert("נכשלנו במשיכת נתונים מהשרת. בדוק את ה-Console.");
        }
    }
}

// טעינת הקטלוג ברגע שהדף עולה
document.addEventListener('DOMContentLoaded', function() {
    fetchCatalog(false);
});

window.onclick = function(event) {
    const modal = document.getElementById('contentModal');

    if (event.target === modal) {
        closeModal();
    }
};

// חשיפה לפונקציות שנקראות מתוך ה-HTML
window.ttSearch = ttSearch;
window.handleRefresh = handleRefresh;
window.closeModal = closeModal;