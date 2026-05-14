let adminCatalogData = [];
let categoriesData = [];
let interestsData = [];

let editingCategoryId = null;
let editingInterestId = null;

const uploadForm = document.getElementById('uploadForm');
const statusMessage = document.getElementById('statusMessage');
const contentFile = document.getElementById('contentFile');
const filePreview = document.getElementById('filePreview');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const removeFileBtn = document.getElementById('removeFileBtn');
const titleInput = document.getElementById('title');

const categorySelect = document.getElementById('category');
const interestsContainer = document.getElementById('interestsContainer');

const contentTableBody = document.getElementById('contentTableBody');

const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editCategorySelect = document.getElementById('editCategory');
const editInterestsContainer = document.getElementById('editInterestsContainer');

const categoryForm = document.getElementById('categoryForm');
const categoryNameInput = document.getElementById('categoryName');
const parentCategorySelect = document.getElementById('parentCategory');
const categoryStatusMessage = document.getElementById('categoryStatusMessage');
const categoriesTableBody = document.getElementById('categoriesTableBody');
const saveCategoryBtn = document.getElementById('saveCategoryBtn');

const interestForm = document.getElementById('interestForm');
const interestNameInput = document.getElementById('interestName');
const interestStatusMessage = document.getElementById('interestStatusMessage');
const interestsTableBody = document.getElementById('interestsTableBody');
const saveInterestBtn = document.getElementById('saveInterestBtn');

function api() {
    if (!window.TactiTokAPI) {
        throw new Error("api.js לא נטען. ודא שקובץ api.js קיים ונטען לפני admin.js");
    }

    return window.TactiTokAPI;
}

function clearStatus() {
    if (statusMessage) {
        statusMessage.textContent = "";
    }
}

function setStatus(element, message, color = "black") {
    if (!element) return;

    element.textContent = message;
    element.style.color = color;
}

function normalizeList(response, possibleKeys = ["items", "data", "results"]) {
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

function getId(item) {
    return item?.id ?? item?._id ?? item?.uuid ?? "";
}

function getCategoryId(category) {
    if (typeof category === "string") return category;

    return category?.id ?? category?.category_id ?? category?.uuid ?? category?.name ?? "";
}

function getCategoryName(category) {
    if (typeof category === "string") return category;

    return category?.name ?? category?.title ?? category?.category_name ?? category?.category ?? "";
}

function getCategoryParentId(category) {
    return category?.parent_id ?? category?.parentCategoryId ?? category?.parent_category_id ?? category?.parent ?? "";
}

function getParentCategoryName(parentId) {
    if (!parentId) return "";

    const parent = categoriesData.find(category => {
        return String(getCategoryId(category)) === String(parentId);
    });

    return parent ? getCategoryName(parent) : "";
}

function getInterestId(interest) {
    if (typeof interest === "string") return interest;

    return interest?.id ?? interest?.interest_id ?? interest?.uuid ?? interest?.name ?? "";
}

function getInterestName(interest) {
    if (typeof interest === "string") return interest;

    return interest?.name ?? interest?.title ?? interest?.interest_name ?? interest?.interest ?? "";
}

function getContentId(item) {
    return item?.id ?? item?._id ?? item?.uuid ?? "";
}

function getContentType(item) {
    return item?.type ?? item?.content_type ?? item?.file_type ?? "";
}

function getContentTitle(item) {
    return item?.title ?? item?.name ?? "";
}

function getContentCategory(item) {
    if (!item) return "";

    if (typeof item.category === "object" && item.category !== null) {
        return getCategoryName(item.category);
    }

    if (item.category ?? item.category_name) {
        return item.category ?? item.category_name;
    }

    if (item.category_id) {
        const category = categoriesData.find(currentCategory => {
            return String(getCategoryId(currentCategory)) === String(item.category_id);
        });

        return category ? getCategoryName(category) : item.category_id;
    }

    return "";
}

function getContentInterests(item) {
    if (!item) return [];

    const rawInterests = item.interests ?? item.interest_names ?? item.interest_ids ?? [];

    if (Array.isArray(rawInterests)) {
        return rawInterests.map(interest => {
            if (typeof interest === "object" && interest !== null) {
                return getInterestName(interest);
            }

            return String(interest);
        });
    }

    if (typeof rawInterests === "string") {
        return rawInterests
            .split(",")
            .map(value => value.trim())
            .filter(Boolean);
    }

    return [];
}

function resetUploadFormAfterSuccess() {
    uploadForm.reset();

    filePreview.classList.add('hidden');
    contentFile.classList.remove('hidden');

    renderCategoryOptions(categorySelect);
    renderInterestCheckboxes(interestsContainer);
}

function enrichUploadFormData(formData) {
    const selectedCategoryOption = categorySelect.options[categorySelect.selectedIndex];

    formData.delete("category");
    formData.delete("interests");

    if (selectedCategoryOption && selectedCategoryOption.value) {
        formData.set("category_id", selectedCategoryOption.value);
    }

    const selectedInterestCheckboxes = interestsContainer.querySelectorAll('input[name="interest_ids"]:checked');

    formData.delete("interest_ids");

    selectedInterestCheckboxes.forEach(checkbox => {
        if (checkbox.value) {
            formData.append("interest_ids", checkbox.value);
        }
    });

    return formData;
}

// בחירת קובץ להצגה באדמין
if (contentFile) {
    contentFile.addEventListener('change', function() {
        clearStatus();

        if (this.files && this.files.length > 0) {
            fileNameDisplay.textContent = this.files[0].name;
            contentFile.classList.add('hidden');
            filePreview.classList.remove('hidden');
        }
    });
}

// הסרת קובץ שנבחר
if (removeFileBtn) {
    removeFileBtn.addEventListener('click', function() {
        clearStatus();

        contentFile.value = '';
        filePreview.classList.add('hidden');
        contentFile.classList.remove('hidden');
    });
}

// ניקוי הודעת סטטוס כאשר משנים כותרת
if (titleInput) {
    titleInput.addEventListener('input', clearStatus);
}

// העלאת תוכן לשרת האמיתי
if (uploadForm) {
    uploadForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const submitBtn = document.getElementById('submitBtn');

        try {
            setStatus(statusMessage, "מעלה קובץ...", "black");

            submitBtn.disabled = true;
            progressContainer.classList.remove('hidden');
            progressBar.style.width = '0%';
            progressText.textContent = '0%';

            let formData = new FormData(uploadForm);
            formData = enrichUploadFormData(formData);

            await api().uploadContent(formData, function(percentComplete) {
                progressBar.style.width = percentComplete + '%';
                progressText.textContent = percentComplete + '%';
            });

            setStatus(statusMessage, "התוכן עלה בהצלחה!", "green");

            resetUploadFormAfterSuccess();

            setTimeout(() => {
                progressContainer.classList.add('hidden');
            }, 1500);

            await loadAdminTable();
        } catch (error) {
            console.error("שגיאה בהעלאה:", error);
            setStatus(statusMessage, "שגיאה בהעלאה: " + error.message, "red");
            progressContainer.classList.add('hidden');
        } finally {
            submitBtn.disabled = false;
        }
    });
}

// טעינת טבלת תכנים
async function loadAdminTable() {
    try {
        const response = await api().getCatalog();
        adminCatalogData = normalizeList(response, ["items", "data", "results", "catalog"]);

        refreshTableDisplay();
    } catch (error) {
        console.error("שגיאה בטעינת טבלת התכנים:", error);

        if (contentTableBody) {
            contentTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; color:red;">
                        שגיאה בטעינת התכנים מהשרת
                    </td>
                </tr>
            `;
        }
    }
}

// ציור מחדש של טבלת התכנים
function refreshTableDisplay() {
    if (!contentTableBody) return;

    contentTableBody.innerHTML = '';

    if (!adminCatalogData.length) {
        contentTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    אין תכנים להצגה
                </td>
            </tr>
        `;
        return;
    }

    adminCatalogData.forEach(item => {
        const id = getContentId(item);
        const title = getContentTitle(item);
        const type = getContentType(item);
        const category = getContentCategory(item);

        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${escapeHtml(id)}</td>
            <td><strong>${escapeHtml(title)}</strong></td>
            <td>
                <span style="background:#eee; padding:2px 6px; border-radius:4px; font-size:12px;">
                    ${escapeHtml(type)}
                </span>
            </td>
            <td>${escapeHtml(category || 'לא הוגדר')}</td>
            <td></td>
        `;

        const actionsCell = tr.querySelector('td:last-child');

        const editButton = document.createElement('button');
        editButton.className = 'action-btn btn-edit';
        editButton.textContent = 'ערוך';
        editButton.addEventListener('click', () => editItem(id));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'action-btn btn-delete';
        deleteButton.textContent = 'מחק';
        deleteButton.addEventListener('click', () => deleteItem(id, deleteButton));

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);

        contentTableBody.appendChild(tr);
    });
}

// מחיקת פריט תוכן
async function deleteItem(id, buttonElement) {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את פריט ${id}?`)) return;

    buttonElement.disabled = true;
    buttonElement.textContent = "...";

    try {
        await api().deleteContent(id);

        adminCatalogData = adminCatalogData.filter(item => {
            return String(getContentId(item)) !== String(id);
        });

        refreshTableDisplay();
        alert("הפריט נמחק בהצלחה!");
    } catch (error) {
        console.error("שגיאה במחיקת פריט:", error);
        alert("שגיאה במחיקת הפריט: " + error.message);

        buttonElement.disabled = false;
        buttonElement.textContent = "מחק";
    }
}

// פתיחת מודל עריכת פריט
function editItem(id) {
    const item = adminCatalogData.find(currentItem => {
        return String(getContentId(currentItem)) === String(id);
    });

    if (!item) {
        console.error("לא נמצא פריט עם המזהה:", id);
        return;
    }

    document.getElementById('editId').value = getContentId(item);
    document.getElementById('editTitle').value = getContentTitle(item);
    document.getElementById('editDescription').value = item.description ?? '';

    renderCategoryOptions(editCategorySelect, getContentCategory(item));
    renderInterestCheckboxes(editInterestsContainer, getContentInterests(item));

    editModal.classList.remove('hidden');
}

// סגירת מודל עריכה
function closeEditModal() {
    editModal.classList.add('hidden');
}

// שמירת עריכת פריט תוכן
if (editForm) {
    editForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const submitBtn = document.getElementById('saveEditBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'שומר...';

        try {
            const id = document.getElementById('editId').value;
            const selectedCategoryOption = editCategorySelect.options[editCategorySelect.selectedIndex];

            const selectedInterestCheckboxes = editInterestsContainer.querySelectorAll('input[name="interest_ids"]:checked');

            const updatedData = {
                title: document.getElementById('editTitle').value.trim(),
                description: document.getElementById('editDescription').value.trim(),
                category_id: selectedCategoryOption ? selectedCategoryOption.value : "",
                interest_ids: Array.from(selectedInterestCheckboxes)
                    .map(checkbox => checkbox.value)
                    .filter(Boolean)
            };

            const response = await api().updateContent(id, updatedData);

            const index = adminCatalogData.findIndex(item => {
                return String(getContentId(item)) === String(id);
            });

            if (index !== -1) {
                adminCatalogData[index] = {
                    ...adminCatalogData[index],
                    ...updatedData,
                    ...(response && typeof response === "object" ? response : {})
                };
            }

            refreshTableDisplay();
            closeEditModal();
            alert("הפריט עודכן בהצלחה!");
        } catch (error) {
            console.error("שגיאה בעדכון פריט:", error);
            alert("שגיאת תקשורת מול השרת: " + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'שמור שינויים';
        }
    });
}

// טעינת קטגוריות
async function loadCategories() {
    try {
        const response = await api().getCategories();
        categoriesData = normalizeList(response, ["items", "data", "results", "categories"]);

        renderCategoriesTable();
        renderCategoryOptions(categorySelect);
        renderCategoryOptions(editCategorySelect);
        renderParentCategoryOptions();
    } catch (error) {
        console.error("שגיאה בטעינת קטגוריות:", error);
        setStatus(categoryStatusMessage, "שגיאה בטעינת קטגוריות מהשרת", "red");
    }
}

// ציור אפשרויות קטגוריה בטפסים
function renderCategoryOptions(selectElement, selectedValue = "") {
    if (!selectElement) return;

    selectElement.innerHTML = '<option value="">בחרו קטגוריה...</option>';

    categoriesData.forEach(category => {
        const id = getCategoryId(category);
        const name = getCategoryName(category);
        const parentId = getCategoryParentId(category);
        const parentName = getParentCategoryName(parentId);

        if (!name) return;

        const option = document.createElement('option');
        option.value = id;
        option.dataset.id = id;
        option.dataset.name = name;
        option.textContent = parentName ? `${parentName} / ${name}` : name;

        if (
            String(selectedValue) === String(name) ||
            String(selectedValue) === String(id)
        ) {
            option.selected = true;
        }

        selectElement.appendChild(option);
    });
}

// ציור קטגוריית אב
function renderParentCategoryOptions(excludeId = null, selectedParentId = "") {
    if (!parentCategorySelect) return;

    parentCategorySelect.innerHTML = '<option value="">ללא קטגוריית אב</option>';

    categoriesData.forEach(category => {
        const id = getCategoryId(category);
        const name = getCategoryName(category);

        if (!id || !name) return;
        if (excludeId && String(id) === String(excludeId)) return;

        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;

        if (String(selectedParentId) === String(id)) {
            option.selected = true;
        }

        parentCategorySelect.appendChild(option);
    });
}

// ציור טבלת קטגוריות
function renderCategoriesTable() {
    if (!categoriesTableBody) return;

    categoriesTableBody.innerHTML = "";

    if (!categoriesData.length) {
        categoriesTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;">
                    אין קטגוריות להצגה
                </td>
            </tr>
        `;
        return;
    }

    categoriesData.forEach(category => {
        const id = getCategoryId(category);
        const name = getCategoryName(category);
        const parentId = getCategoryParentId(category);
        const parentName = getParentCategoryName(parentId);

        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${escapeHtml(id)}</td>
            <td><strong>${escapeHtml(name)}</strong></td>
            <td>${escapeHtml(parentName || "ללא")}</td>
            <td></td>
        `;

        const actionsCell = tr.querySelector('td:last-child');

        const editButton = document.createElement('button');
        editButton.className = 'action-btn btn-edit';
        editButton.textContent = 'ערוך';
        editButton.addEventListener('click', () => editCategory(id));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'action-btn btn-delete';
        deleteButton.textContent = 'מחק';
        deleteButton.addEventListener('click', () => deleteCategory(id));

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);

        categoriesTableBody.appendChild(tr);
    });
}

// הוספה או עריכה של קטגוריה
if (categoryForm) {
    categoryForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const name = categoryNameInput.value.trim();
        const parentId = parentCategorySelect.value || null;

        if (!name) {
            setStatus(categoryStatusMessage, "יש להזין שם קטגוריה", "red");
            return;
        }

        const payload = {
            name: name,
            parent_id: parentId
        };

        saveCategoryBtn.disabled = true;

        try {
            if (editingCategoryId) {
                await api().updateCategory(editingCategoryId, payload);
                setStatus(categoryStatusMessage, "הקטגוריה עודכנה בהצלחה", "green");
            } else {
                await api().createCategory(payload);
                setStatus(categoryStatusMessage, "הקטגוריה נוספה בהצלחה", "green");
            }

            editingCategoryId = null;
            categoryForm.reset();
            saveCategoryBtn.textContent = "הוסף קטגוריה";

            await loadCategories();
        } catch (error) {
            console.error("שגיאה בשמירת קטגוריה:", error);
            setStatus(categoryStatusMessage, "שגיאה בשמירת קטגוריה: " + error.message, "red");
        } finally {
            saveCategoryBtn.disabled = false;
        }
    });
}

// עריכת קטגוריה
function editCategory(id) {
    const category = categoriesData.find(currentCategory => {
        return String(getCategoryId(currentCategory)) === String(id);
    });

    if (!category) return;

    editingCategoryId = id;

    categoryNameInput.value = getCategoryName(category);
    renderParentCategoryOptions(id, getCategoryParentId(category));

    saveCategoryBtn.textContent = "שמור שינויים";
    setStatus(categoryStatusMessage, "מצב עריכה: עדכן את הפרטים ולחץ שמור", "black");

    categoryNameInput.focus();
}

// מחיקת קטגוריה
async function deleteCategory(id) {
    if (!confirm("האם למחוק את הקטגוריה?")) return;

    try {
        await api().deleteCategory(id);

        if (editingCategoryId && String(editingCategoryId) === String(id)) {
            editingCategoryId = null;
            categoryForm.reset();
            saveCategoryBtn.textContent = "הוסף קטגוריה";
        }

        await loadCategories();
        setStatus(categoryStatusMessage, "הקטגוריה נמחקה בהצלחה", "green");
    } catch (error) {
        console.error("שגיאה במחיקת קטגוריה:", error);
        setStatus(categoryStatusMessage, "שגיאה במחיקת קטגוריה: " + error.message, "red");
    }
}

// טעינת תחומי עניין
async function loadInterests() {
    try {
        const response = await api().getInterests();
        interestsData = normalizeList(response, ["items", "data", "results", "interests"]);

        renderInterestsTable();
        renderInterestCheckboxes(interestsContainer);
        renderInterestCheckboxes(editInterestsContainer);
    } catch (error) {
        console.error("שגיאה בטעינת תחומי עניין:", error);
        setStatus(interestStatusMessage, "שגיאה בטעינת תחומי עניין מהשרת", "red");
    }
}

// ציור checkbox של תחומי עניין
function renderInterestCheckboxes(containerElement, selectedValues = []) {
    if (!containerElement) return;

    containerElement.innerHTML = "";

    if (!interestsData.length) {
        containerElement.innerHTML = "<span>אין תחומי עניין להצגה</span>";
        return;
    }

    const selectedSet = new Set(
        selectedValues.map(value => String(value))
    );

    interestsData.forEach(interest => {
        const id = getInterestId(interest);
        const name = getInterestName(interest);

        if (!name) return;

        const label = document.createElement('label');
        const checkbox = document.createElement('input');

        checkbox.type = "checkbox";
        checkbox.name = "interest_ids";
        checkbox.value = id;
        checkbox.dataset.id = id;
        checkbox.dataset.name = name;

        if (selectedSet.has(String(name)) || selectedSet.has(String(id))) {
            checkbox.checked = true;
        }

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + name));

        containerElement.appendChild(label);
    });
}

// ציור טבלת תחומי עניין
function renderInterestsTable() {
    if (!interestsTableBody) return;

    interestsTableBody.innerHTML = "";

    if (!interestsData.length) {
        interestsTableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center;">
                    אין תחומי עניין להצגה
                </td>
            </tr>
        `;
        return;
    }

    interestsData.forEach(interest => {
        const id = getInterestId(interest);
        const name = getInterestName(interest);

        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${escapeHtml(id)}</td>
            <td><strong>${escapeHtml(name)}</strong></td>
            <td></td>
        `;

        const actionsCell = tr.querySelector('td:last-child');

        const editButton = document.createElement('button');
        editButton.className = 'action-btn btn-edit';
        editButton.textContent = 'ערוך';
        editButton.addEventListener('click', () => editInterest(id));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'action-btn btn-delete';
        deleteButton.textContent = 'מחק';
        deleteButton.addEventListener('click', () => deleteInterest(id));

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);

        interestsTableBody.appendChild(tr);
    });
}

// הוספה או עריכה של תחום עניין
if (interestForm) {
    interestForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const name = interestNameInput.value.trim();

        if (!name) {
            setStatus(interestStatusMessage, "יש להזין שם תחום עניין", "red");
            return;
        }

        const payload = {
            name: name
        };

        saveInterestBtn.disabled = true;

        try {
            if (editingInterestId) {
                await api().updateInterest(editingInterestId, payload);
                setStatus(interestStatusMessage, "תחום העניין עודכן בהצלחה", "green");
            } else {
                await api().createInterest(payload);
                setStatus(interestStatusMessage, "תחום העניין נוסף בהצלחה", "green");
            }

            editingInterestId = null;
            interestForm.reset();
            saveInterestBtn.textContent = "הוסף תחום עניין";

            await loadInterests();
        } catch (error) {
            console.error("שגיאה בשמירת תחום עניין:", error);
            setStatus(interestStatusMessage, "שגיאה בשמירת תחום עניין: " + error.message, "red");
        } finally {
            saveInterestBtn.disabled = false;
        }
    });
}

// עריכת תחום עניין
function editInterest(id) {
    const interest = interestsData.find(currentInterest => {
        return String(getInterestId(currentInterest)) === String(id);
    });

    if (!interest) return;

    editingInterestId = id;

    interestNameInput.value = getInterestName(interest);
    saveInterestBtn.textContent = "שמור שינויים";
    setStatus(interestStatusMessage, "מצב עריכה: עדכן את השם ולחץ שמור", "black");

    interestNameInput.focus();
}

// מחיקת תחום עניין
async function deleteInterest(id) {
    if (!confirm("האם למחוק את תחום העניין?")) return;

    try {
        await api().deleteInterest(id);

        if (editingInterestId && String(editingInterestId) === String(id)) {
            editingInterestId = null;
            interestForm.reset();
            saveInterestBtn.textContent = "הוסף תחום עניין";
        }

        await loadInterests();
        setStatus(interestStatusMessage, "תחום העניין נמחק בהצלחה", "green");
    } catch (error) {
        console.error("שגיאה במחיקת תחום עניין:", error);
        setStatus(interestStatusMessage, "שגיאה במחיקת תחום עניין: " + error.message, "red");
    }
}

// טעינה ראשונית
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await Promise.all([
            loadCategories(),
            loadInterests(),
            loadAdminTable()
        ]);
    } catch (error) {
        console.error("שגיאה בטעינה ראשונית:", error);
    }
});

// חשיפה ל-HTML עבור כפתורי סגירה קיימים
window.closeEditModal = closeEditModal;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.editInterest = editInterest;
window.deleteInterest = deleteInterest;