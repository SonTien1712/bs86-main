# ⚽ BS86 - Booking Sport System 🎾

Tài liệu hướng dẫn cài đặt và khởi chạy hệ thống BS86, bao gồm:

* Backend (Spring Boot)
* Frontend (ReactJS)

---

## 🛠️ Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy của bạn đã cài đặt:

* **Java 21 (JDK 21)**

  * Bắt buộc cho Backend
  * Đảm bảo đã cấu hình biến môi trường JAVA_HOME

* **Node.js & npm**

  * Dùng để chạy Frontend
  * Khuyến nghị dùng bản LTS mới nhất

* **MySQL Server**

  * Dùng làm cơ sở dữ liệu

---

## ⚙️ Hướng dẫn khởi chạy Backend (Spring Boot)

### 1. Chuẩn bị Database

Mở MySQL / MySQL Workbench và chạy lệnh:

```sql
CREATE DATABASE bs86 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

### 2. Cấu hình application.properties / application.yml

Đi tới thư mục:

```
src/main/resources/
```

Cấu hình các thông tin sau:

🔹 Kết nối MySQL

```
spring.datasource.url=jdbc:mysql://localhost:3306/bs86
spring.datasource.username=your_username
spring.datasource.password=your_password
```

🔹 JWT

```
jwt.secret=your_secret_key
jwt.expiration=your_token_expiration
```

🔹 Cloudinary

```
cloudinary.cloud-name=your_cloud_name
cloudinary.api-key=your_api_key
cloudinary.api-secret=your_api_secret
```

---

⚠️ **Lưu ý khi clone project**

Nếu bạn đã có database cũ:

👉 Đặt:

```
spring.jpa.hibernate.ddl-auto=create
```

✔ Mục đích:

* Tránh conflict schema
* Tạo lại database theo entity mới nhất

👉 Sau khi chạy ổn định:

```
spring.jpa.hibernate.ddl-auto=update
```

---

### 3. Build và chạy Backend

```bash
mvn clean install -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

👉 Backend: http://localhost:8080

---

## 🎨 Hướng dẫn khởi chạy Frontend (ReactJS)

### 1. Cài dependencies

```bash
npm install
```

### 2. Chạy ứng dụng

```bash
npm run dev
```

👉 Frontend: http://localhost:5173

---

## 🚀 Troubleshooting

Nếu gặp lỗi, hãy kiểm tra:

* Java đúng version 21
* MySQL đã bật
* Config DB đúng
* Đã chạy npm install
* Không bị trùng port
