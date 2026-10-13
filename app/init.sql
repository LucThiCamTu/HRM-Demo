-- Tạo bảng phòng ban
CREATE TABLE IF NOT EXISTS phong_ban (
    id SERIAL PRIMARY KEY,
    ma_phong VARCHAR(20) UNIQUE NOT NULL,
    ten_phong VARCHAR(100) NOT NULL,
    truong_phong VARCHAR(100)
);

-- Tạo bảng nhân viên
CREATE TABLE IF NOT EXISTS nhan_vien (
    id SERIAL PRIMARY KEY,
    ma_nv VARCHAR(20) UNIQUE NOT NULL,
    ho_ten VARCHAR(100) NOT NULL,
    gioi_tinh VARCHAR(10),
    chuc_vu VARCHAR(100),
    so_dien_thoai VARCHAR(20),
    phong_ban_id INT REFERENCES phong_ban(id)
);

-- Tạo bảng tài khoản đăng nhập
CREATE TABLE IF NOT EXISTS tai_khoan (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm phòng ban mẫu
INSERT INTO phong_ban (ma_phong, ten_phong, truong_phong)
VALUES
    ('PB01', 'Công nghệ thông tin', 'Nguyễn Văn A'),
    ('PB02', 'Kế toán', 'Trần Thị B'),
    ('PB03', 'Nhân sự', 'Lê Văn C')
ON CONFLICT (ma_phong) DO NOTHING;

-- Thêm nhân viên mẫu
INSERT INTO nhan_vien
    (ma_nv, ho_ten, gioi_tinh, chuc_vu, so_dien_thoai, phong_ban_id)
VALUES
    ('NV001', 'Nguyễn Văn A', 'Nam', 'Nhân viên', '0912345678', 1),
    ('NV002', 'Trần Thị B', 'Nữ', 'Nhân viên', '0987654321', 2)
ON CONFLICT (ma_nv) DO NOTHING;