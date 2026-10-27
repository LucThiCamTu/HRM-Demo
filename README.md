HRM - Hệ thống quản lý nhân sự 

## 1. Giới thiệu
**HRM-Demo** là hệ thống quản lý nhân sự hoàn chỉnh được phát triển bằng **Node.js (Express)** và **PostgreSQL**, đóng gói và triển khai tự động bằng **Docker Compose** trên nền tảng Linux/Windows.

Hệ thống hỗ trợ quản lý hồ sơ nhân viên, phòng ban, tự động khởi tạo nhật ký chấm công ngầm mỗi ngày (chặn nhân viên đã nghỉ việc) và tổng hợp báo cáo thống kê trực quan.
 2. Công nghệ sử dụng
- **Node.js & Express.js**: Xây dựng RESTful API backend và Cron job chấm công tự động.
- **PostgreSQL**: Cơ sở dữ liệu quan hệ lưu trữ thông tin nhân sự và chấm công.
- **HTML5, CSS3, JavaScript (Vanilla JS) & Chart.js**: Giao diện người dùng (Dashboard, CRUD Modal, Báo cáo).
- **Docker & Docker Compose**: Đóng gói môi trường và triển khai hệ thống đa dịch vụ.
- **\*Git & GitHub**: Quản lý phiên bản mã nguồn.
- 3. Kiến trúc hệ thống

```text
               +----------------------------------+
               |       Người dùng / Browser       |
               +----------------------------------+
                                |
                                v
                    [HRM Web App] (Port 3000)
                    (Express.js + Frontend UI)
                                |
                                v
                   [PostgreSQL] (Port 5432)
Cả ứng dụng Web Node.js và Cơ sở dữ liệu PostgreSQL được kết nối thông qua mạng Docker nội bộ (hrm-network).

4. Cấu trúc dự án
Plaintext
HRM-Demo/
├── app/
│   ├── public/
│   │   └── index.html      # Giao diện người dùng (Dashboard, CRUD, Báo cáo)
│   └── server.js           # API RESTful backend & Cron Job chấm công tự động
├── docker-compose.yml      # Cấu hình container Node.js & PostgreSQL
├── package.json            # Khai báo phụ thuộc ứng dụng
├── README.md               # Hướng dẫn chạy và thông tin dự án
└── server.js               # File khởi chạy hệ thống ở thư mục gốc
5. Yêu cầu hệ thống
Hệ điều hành Windows / Ubuntu Linux (có hỗ trợ Docker).
Docker Desktop / Docker Engine.
Docker Compose Plugin.
Git.
6. Hướng dẫn cài đặt & Triển khai
Bước 1: Clone repository
Bash
git clone [https://github.com/LucThiCamTu/HRM-Demo.git](https://github.com/LucThiCamTu/HRM-Demo.git)
cd HRM-Demo
Bước 2: Khởi chạy hệ thống bằng Docker
Bash
docker compose up -d --build
Bước 3: Kiểm tra trạng thái Container
Bash
docker compose ps
Bước 4: Truy cập hệ thống
Website HRM: http://localhost:3000/
(Khi truy cập từ máy khác trong cùng mạng, thay localhost bằng địa chỉ IP của máy chủ).
7. Các biện pháp bảo mật & Tối ưu
Network Isolation: Các dịch vụ giao tiếp nội bộ trong mạng riêng biệt do Docker quản lý.
Input Sanitization: Lọc và xóa các ký tự đặc biệt trong giao diện để chống tấn công XSS.
Data Integrity: Ràng buộc khóa ngoại (FOREIGN KEY) và duy nhất (UNIQUE) trên PostgreSQL để tránh trùng lặp chấm công.
Automatic Filtering: Tự động loại bỏ nhân viên ở trạng thái Đã nghỉ việc khỏi bảng chấm công hàng ngày.
Environment Variables: Cấu hình kết nối DB linh hoạt qua biến môi trường.
8. Giám sát hệ thống & Tự động hóa
Tự động chấm công: Sử dụng hàm lập lịch ngầm tự động quét và chèn dữ liệu chấm công ngày mới cho nhân viên đang làm việc.
Log hệ thống: Quản lý và theo dõi nhật ký hoạt động thông qua Docker logs.
Báo cáo thời gian thực: Tự động tính toán tỷ lệ nhân viên đi làm, mật độ nhân sự/phòng ban ngay khi có thay đổi.
9. Kiểm tra và Vận hành
Kiểm tra trạng thái container:
Bash
docker compose ps
Xem log hệ thống (50 dòng mới nhất):
Bash
docker compose logs --tail=50 web
Khởi động lại dịch vụ Web:
Bash
docker compose restart web
Cảnh báo: Tránh dùng lệnh docker compose down -v nếu không muốn xóa dữ liệu PostgreSQL hiện có.

10. Repository
GitHub Repository: https://github.com/LucThiCamTu/HRM-Demo
