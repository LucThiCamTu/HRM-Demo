CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20),
    gender VARCHAR(20),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    position VARCHAR(100),
    salary NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'Đang làm việc',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (name) VALUES
('Phòng Công nghệ thông tin'),
('Phòng Nhân sự'),
('Phòng Kế toán'),
('Phòng Kinh doanh'),
('Phòng Marketing')
ON CONFLICT (name) DO NOTHING;

INSERT INTO employees
(full_name, email, phone, gender, department_id, position, salary, status)
VALUES
('Nguyễn Văn An', 'an.nguyen@example.com', '0901234567', 'Nam', 1, 'Nhân viên IT', 12000000, 'Đang làm việc'),
('Trần Thị Bình', 'binh.tran@example.com', '0902345678', 'Nữ', 2, 'Chuyên viên nhân sự', 11000000, 'Đang làm việc'),
('Lê Văn Cường', 'cuong.le@example.com', '0903456789', 'Nam', 3, 'Kế toán viên', 10000000, 'Đang làm việc'),
('Phạm Thị Dung', 'dung.pham@example.com', '0904567890', 'Nữ', 4, 'Nhân viên kinh doanh', 13000000, 'Đang làm việc'),
('Hoàng Văn Đức', 'duc.hoang@example.com', '0905678901', 'Nam', 1, 'Lập trình viên', 15000000, 'Đang làm việc'),
('Vũ Thị Hà', 'ha.vu@example.com', '0906789012', 'Nữ', 5, 'Chuyên viên marketing', 11500000, 'Đang làm việc'),
('Đặng Văn Hùng', 'hung.dang@example.com', '0907890123', 'Nam', 2, 'Trưởng nhóm nhân sự', 18000000, 'Đang làm việc'),
('Bùi Thị Lan', 'lan.bui@example.com', '0908901234', 'Nữ', 3, 'Kế toán tổng hợp', 14000000, 'Đang làm việc')
ON CONFLICT (email) DO NOTHING;