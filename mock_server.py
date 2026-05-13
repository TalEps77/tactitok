from http.server import SimpleHTTPRequestHandler, HTTPServer
import json
import re
from email.parser import BytesParser
from email import policy

PORT = 5500

catalog = [
    {
        "id": "1",
        "title": "סרטון בטיחות לדוגמה",
        "description": "תוכן וידאו לבדיקה",
        "type": "VID",
        "category": "בטיחות",
        "interests": ["נהלים", "שטח"],
        "duration": "01:20",
        "file_url": "https://www.w3schools.com/html/mov_bbb.mp4",
        "version": 1
    },
    {
        "id": "2",
        "title": "מסמך הדרכה לדוגמה",
        "description": "מסמך PDF לבדיקה",
        "type": "PDF",
        "category": "הדרכה",
        "interests": ["ניהול", "טכני"],
        "pages": 3,
        "file_url": "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
        "version": 1
    }
]

categories = [
    {"id": "cat-1", "name": "בטיחות", "parent_id": None},
    {"id": "cat-2", "name": "אופרציה", "parent_id": None},
    {"id": "cat-3", "name": "הדרכה", "parent_id": None}
]

interests = [
    {"id": "int-1", "name": "נהלים"},
    {"id": "int-2", "name": "שטח"},
    {"id": "int-3", "name": "ניהול"},
    {"id": "int-4", "name": "טכני"}
]


class MockHandler(SimpleHTTPRequestHandler):
    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def clean_path(self):
        path = self.path.split("?")[0]

        if path.startswith("/api/"):
            path = path[4:]

        return path

    def add_value(self, data, key, value):
        if key in data:
            if not isinstance(data[key], list):
                data[key] = [data[key]]
            data[key].append(value)
        else:
            data[key] = value

    def get_first(self, data, key, default=""):
        value = data.get(key, default)

        if isinstance(value, list):
            return value[0] if value else default

        return value if value is not None else default

    def get_many(self, data, key):
        value = data.get(key, [])

        if value is None:
            return []

        if isinstance(value, list):
            return value

        return [value]

    def read_request_data(self):
        content_length = int(self.headers.get("Content-Length", 0))
        content_type = self.headers.get("Content-Type", "")

        if content_length <= 0:
            return {}

        raw_body = self.rfile.read(content_length)

        if "application/json" in content_type:
            try:
                return json.loads(raw_body.decode("utf-8"))
            except Exception:
                return {}

        if "multipart/form-data" in content_type:
            data = {}

            message_bytes = (
                f"Content-Type: {content_type}\r\n"
                "MIME-Version: 1.0\r\n"
                "\r\n"
            ).encode("utf-8") + raw_body

            message = BytesParser(policy=policy.default).parsebytes(message_bytes)

            for part in message.iter_parts():
                disposition = part.get("Content-Disposition", "")
                if "form-data" not in disposition:
                    continue

                name = part.get_param("name", header="content-disposition")
                filename = part.get_filename()

                if not name:
                    continue

                if filename:
                    payload = part.get_payload(decode=True) or b""
                    file_info = {
                        "filename": filename,
                        "content_type": part.get_content_type(),
                        "size": len(payload)
                    }
                    self.add_value(data, name, file_info)
                else:
                    value = part.get_content()
                    self.add_value(data, name, value)

            return data

        return {}

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        path = self.clean_path()

        if path == "/health":
            self.send_json({"status": "ok"})
            return

        if path == "/catalog":
            self.send_json(catalog)
            return

        if path == "/categories":
            self.send_json(categories)
            return

        if path == "/interests":
            self.send_json(interests)
            return

        return super().do_GET()

    def do_POST(self):
        path = self.clean_path()
        data = self.read_request_data()

        if path == "/content":
            file_info = data.get("contentFile")

            if isinstance(file_info, list):
                file_info = file_info[0]

            filename = ""
            content_type = ""

            if isinstance(file_info, dict):
                filename = file_info.get("filename", "")
                content_type = file_info.get("content_type", "")

            title = self.get_first(data, "title", "ללא כותרת")
            description = self.get_first(data, "description", "")
            category = self.get_first(data, "category", "ללא קטגוריה")
            selected_interests = self.get_many(data, "interests")

            lower_filename = filename.lower()
            lower_content_type = content_type.lower()

            is_video = lower_filename.endswith(".mp4") or "video" in lower_content_type

            new_id = str(len(catalog) + 1)

            new_item = {
                "id": new_id,
                "title": title,
                "description": description,
                "type": "VID" if is_video else "PDF",
                "category": category,
                "interests": selected_interests,
                "version": 1
            }

            if is_video:
                new_item["duration"] = "01:20"
                new_item["file_url"] = "https://www.w3schools.com/html/mov_bbb.mp4"
            else:
                new_item["pages"] = 3
                new_item["file_url"] = "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"

            catalog.append(new_item)
            self.send_json(new_item, 201)
            return

        if path == "/categories":
            name = self.get_first(data, "name", "").strip()
            parent_id = self.get_first(data, "parent_id", None)

            if parent_id == "":
                parent_id = None

            if not name:
                self.send_json({"error": "Category name is required"}, 400)
                return

            new_id = f"cat-{len(categories) + 1}"

            new_category = {
                "id": new_id,
                "name": name,
                "parent_id": parent_id
            }

            categories.append(new_category)
            self.send_json(new_category, 201)
            return

        if path == "/interests":
            name = self.get_first(data, "name", "").strip()

            if not name:
                self.send_json({"error": "Interest name is required"}, 400)
                return

            new_id = f"int-{len(interests) + 1}"

            new_interest = {
                "id": new_id,
                "name": name
            }

            interests.append(new_interest)
            self.send_json(new_interest, 201)
            return

        self.send_json({"error": "Not found"}, 404)

    def do_PUT(self):
        path = self.clean_path()
        data = self.read_request_data()

        content_match = re.match(r"^/content/(.+)$", path)
        category_match = re.match(r"^/categories/(.+)$", path)
        interest_match = re.match(r"^/interests/(.+)$", path)

        if content_match:
            item_id = content_match.group(1)

            for item in catalog:
                if str(item["id"]) == str(item_id):
                    item.update(data)
                    self.send_json(item)
                    return

            self.send_json({"error": "Content item not found"}, 404)
            return

        if category_match:
            category_id = category_match.group(1)

            for category in categories:
                if str(category["id"]) == str(category_id):
                    category.update(data)
                    self.send_json(category)
                    return

            self.send_json({"error": "Category not found"}, 404)
            return

        if interest_match:
            interest_id = interest_match.group(1)

            for interest in interests:
                if str(interest["id"]) == str(interest_id):
                    interest.update(data)
                    self.send_json(interest)
                    return

            self.send_json({"error": "Interest not found"}, 404)
            return

        self.send_json({"error": "Not found"}, 404)

    def do_DELETE(self):
        global catalog, categories, interests

        path = self.clean_path()

        content_match = re.match(r"^/content/(.+)$", path)
        category_match = re.match(r"^/categories/(.+)$", path)
        interest_match = re.match(r"^/interests/(.+)$", path)

        if content_match:
            item_id = content_match.group(1)
            catalog = [item for item in catalog if str(item["id"]) != str(item_id)]
            self.send_json({"deleted": True})
            return

        if category_match:
            category_id = category_match.group(1)
            categories = [category for category in categories if str(category["id"]) != str(category_id)]
            self.send_json({"deleted": True})
            return

        if interest_match:
            interest_id = interest_match.group(1)
            interests = [interest for interest in interests if str(interest["id"]) != str(interest_id)]
            self.send_json({"deleted": True})
            return

        self.send_json({"error": "Not found"}, 404)


if __name__ == "__main__":
    server = HTTPServer(("localhost", PORT), MockHandler)

    print(f"Mock server running at http://localhost:{PORT}")
    print(f"Admin:  http://localhost:{PORT}/admin.html")
    print(f"Tablet: http://localhost:{PORT}/tablet.html")

    server.serve_forever()