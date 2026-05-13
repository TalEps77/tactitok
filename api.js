(function () {
    const DEFAULT_API_BASE = "";

    function getApiBase() {
        const base = window.TACTITOK_API_BASE ?? DEFAULT_API_BASE;
        return String(base).replace(/\/+$/, "");
    }

    function buildUrl(path) {
        const base = getApiBase();
        const cleanPath = String(path || "").replace(/^\/+/, "");

        if (!base) {
            return "/" + cleanPath;
        }

        return base + "/" + cleanPath;
    }

    async function parseResponse(response) {
        const contentType = response.headers.get("content-type") || "";

        let responseBody = null;

        if (contentType.includes("application/json")) {
            responseBody = await response.json();
        } else {
            responseBody = await response.text();
        }

        if (!response.ok) {
            let message = "API request failed";

            if (responseBody && typeof responseBody === "object") {
                message =
                    responseBody.detail ||
                    responseBody.message ||
                    responseBody.error ||
                    JSON.stringify(responseBody);
            } else if (responseBody) {
                message = responseBody;
            }

            throw new Error(`${message} (status ${response.status})`);
        }

        return responseBody;
    }

    async function request(path, options = {}) {
        const url = buildUrl(path);

        const fetchOptions = {
            method: options.method || "GET",
            headers: options.headers || {},
            body: options.body
        };

        if (
            fetchOptions.body &&
            !(fetchOptions.body instanceof FormData) &&
            typeof fetchOptions.body !== "string"
        ) {
            fetchOptions.headers["Content-Type"] = "application/json";
            fetchOptions.body = JSON.stringify(fetchOptions.body);
        }

        const response = await fetch(url, fetchOptions);
        return parseResponse(response);
    }

    function uploadWithProgress(path, formData, onProgress) {
        return new Promise(function (resolve, reject) {
            const xhr = new XMLHttpRequest();
            const url = buildUrl(path);

            xhr.open("POST", url, true);

            xhr.upload.addEventListener("progress", function (event) {
                if (event.lengthComputable && typeof onProgress === "function") {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    onProgress(percentComplete);
                }
            });

            xhr.addEventListener("load", function () {
                const contentType = xhr.getResponseHeader("content-type") || "";
                let responseBody = xhr.responseText;

                if (contentType.includes("application/json") && xhr.responseText) {
                    try {
                        responseBody = JSON.parse(xhr.responseText);
                    } catch (error) {
                        reject(new Error("השרת החזיר JSON לא תקין"));
                        return;
                    }
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(responseBody);
                    return;
                }

                let message = "שגיאה בבקשת API";

                if (responseBody && typeof responseBody === "object") {
                    message =
                        responseBody.detail ||
                        responseBody.message ||
                        responseBody.error ||
                        JSON.stringify(responseBody);
                } else if (responseBody) {
                    message = responseBody;
                }

                reject(new Error(`${message} (status ${xhr.status})`));
            });

            xhr.addEventListener("error", function () {
                reject(new Error("שגיאת תקשורת: לא ניתן להגיע לשרת"));
            });

            xhr.addEventListener("abort", function () {
                reject(new Error("הבקשה בוטלה"));
            });

            xhr.send(formData);
        });
    }

    const TactiTokAPI = {
        // Internal helpers
        buildUrl,

        // Health
        getHealth() {
            return request("/health");
        },

        // Catalog
        getCatalog() {
            return request("/catalog");
        },

        // Content
        uploadContent(formData, onProgress) {
            return uploadWithProgress("/content", formData, onProgress);
        },

        updateContent(id, data) {
            return request(`/content/${encodeURIComponent(id)}`, {
                method: "PUT",
                body: data
            });
        },

        deleteContent(id) {
            return request(`/content/${encodeURIComponent(id)}`, {
                method: "DELETE"
            });
        },

        getContentFileUrl(id) {
            return buildUrl(`/content/${encodeURIComponent(id)}/file`);
        },

        // Categories
        getCategories() {
            return request("/categories");
        },

        createCategory(data) {
            return request("/categories", {
                method: "POST",
                body: data
            });
        },

        updateCategory(id, data) {
            return request(`/categories/${encodeURIComponent(id)}`, {
                method: "PUT",
                body: data
            });
        },

        deleteCategory(id) {
            return request(`/categories/${encodeURIComponent(id)}`, {
                method: "DELETE"
            });
        },

        // Interests
        getInterests() {
            return request("/interests");
        },

        createInterest(data) {
            return request("/interests", {
                method: "POST",
                body: data
            });
        },

        updateInterest(id, data) {
            return request(`/interests/${encodeURIComponent(id)}`, {
                method: "PUT",
                body: data
            });
        },

        deleteInterest(id) {
            return request(`/interests/${encodeURIComponent(id)}`, {
                method: "DELETE"
            });
        }
    };

    window.TactiTokAPI = TactiTokAPI;
})();