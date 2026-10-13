
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");

const app = express();
const PORT = Number(process.env.PORT || 3000);

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "hrm",
    user: process.env.DB_USER || "hrm",
    password: process.env.DB_PASSWORD || "123456"
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    store: new pgSession({
        pool,
        createTableIfMissing: true
    }),
    name: "hrm.sid",
    secret: process.env.SESSION_SECRET || "hrm-demo-secret-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 8 * 60 * 60 * 1000
    }
}));

function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: "Bạn chưa đăng nhập." });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: "Bạn chưa đăng nhập." });
    }

    if (req.session.user.role !== "admin") {
        return res.status(403).json({
            error: "Bạn không có quyền thực hiện chức năng này."
        });
    }
    next();
}

async function initDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS phong_ban (
            id SERIAL PRIMARY KEY,
            ma_phong VARCHAR(20) UNIQUE NOT NULL,
            ten_phong VARCHAR(100) NOT NULL,
            truong_phong VARCHAR(100)
        );

        CREATE TABLE IF NOT EXISTS nhan_vien (
            id SERIAL PRIMARY KEY,
            ma_nv VARCHAR(20) UNIQUE NOT NULL,
            ho_ten VARCHAR(100) NOT NULL,
            gioi_tinh VARCHAR(10),
            chuc_vu VARCHAR(100),
            so_dien_thoai VARCHAR(20),
            phong_ban_id INT REFERENCES phong_ban(id)
        );

        CREATE TABLE IF NOT EXISTS tai_khoan (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(20) NOT NULL
                CHECK (role IN ('admin', 'user')),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    await pool.query(`
        INSERT INTO phong_ban (ma_phong, ten_phong, truong_phong)
        VALUES
            ('PB01', 'Công nghệ thông tin', 'Nguyễn Văn A'),
            ('PB02', 'Kế toán', 'Trần Thị B'),
            ('PB03', 'Nhân sự', 'Lê Văn C')
        ON CONFLICT (ma_phong) DO NOTHING;
    `);

    await pool.query(`
        INSERT INTO nhan_vien
            (ma_nv, ho_ten, gioi_tinh, chuc_vu,
             so_dien_thoai, phong_ban_id)
        SELECT v.ma_nv, v.ho_ten, v.gioi_tinh, v.chuc_vu,
               v.so_dien_thoai, p.id
        FROM (VALUES
            ('NV001', 'Nguyễn Văn A', 'Nam', 'Nhân viên',
             '0912345678', 'PB01'),
            ('NV002', 'Trần Thị B', 'Nữ', 'Nhân viên',
             '0987654321', 'PB02')
        ) AS v(ma_nv, ho_ten, gioi_tinh, chuc_vu,
               so_dien_thoai, ma_phong)
        JOIN phong_ban p ON p.ma_phong = v.ma_phong
        ON CONFLICT (ma_nv) DO NOTHING;
    `);

    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";
    const adminHash = await bcrypt.hash(adminPassword, 12);

    await pool.query(`
        INSERT INTO tai_khoan (username, password_hash, role)
        VALUES ($1, $2, 'admin')
        ON CONFLICT (username) DO NOTHING;
    `, [adminUsername, adminHash]);

    const userUsername = process.env.DEMO_USERNAME || "nhanvien";
    const userPassword = process.env.DEMO_PASSWORD || "User@123";
    const userHash = await bcrypt.hash(userPassword, 12);

    await pool.query(`
        INSERT INTO tai_khoan (username, password_hash, role)
        VALUES ($1, $2, 'user')
        ON CONFLICT (username) DO NOTHING;
    `, [userUsername, userHash]);

    console.log("Đã khởi tạo cơ sở dữ liệu HRM.");
}

// Trang đăng nhập
app.get("/login", (req, res) => {
    if (req.session.user) return res.redirect("/");
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Trang quản lý
app.get("/", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Đăng nhập
app.post("/api/login", async (req, res, next) => {
    try {
        const username = String(req.body.username || "").trim();
        const password = String(req.body.password || "");

        if (!username || !password) {
            return res.status(400).json({
                error: "Vui lòng nhập tên đăng nhập và mật khẩu."
            });
        }

        const result = await pool.query(
            `SELECT id, username, password_hash, role
             FROM tai_khoan WHERE username = $1`,
            [username]
        );

        const account = result.rows[0];

        if (!account || !(await bcrypt.compare(password, account.password_hash))) {
            return res.status(401).json({
                error: "Tên đăng nhập hoặc mật khẩu không đúng."
            });
        }

        req.session.regenerate((error) => {
            if (error) return next(error);

            req.session.user = {
                id: account.id,
                username: account.username,
                role: account.role
            };

            req.session.save((saveError) => {
                if (saveError) return next(saveError);
                res.json({
                    message: "Đăng nhập thành công.",
                    user: req.session.user
                });
            });
        });
    } catch (error) {
        next(error);
    }
});

// Thông tin người dùng hiện tại
app.get("/api/me", requireAuth, (req, res) => {
    res.json({ user: req.session.user });
});

// Đăng xuất
app.post("/api/logout", requireAuth, (req, res, next) => {
    req.session.destroy((error) => {
        if (error) return next(error);

        res.clearCookie("hrm.sid", {
            httpOnly: true,
            sameSite: "lax",
            secure: false
        });

        res.json({ message: "Đăng xuất thành công." });
    });
});

// Danh sách phòng ban
app.get("/api/departments", requireAuth, async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT id, ma_phong, ten_phong FROM phong_ban ORDER BY ten_phong"
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// Danh sách nhân viên
app.get("/api/employees", requireAuth, async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT nv.id, nv.ma_nv, nv.ho_ten, nv.gioi_tinh,
                   nv.chuc_vu, nv.so_dien_thoai,
                   nv.phong_ban_id, pb.ten_phong
            FROM nhan_vien nv
            LEFT JOIN phong_ban pb ON nv.phong_ban_id = pb.id
            ORDER BY nv.id DESC
        `);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
});

// Thêm nhân viên: admin
app.post("/api/employees", requireAdmin, async (req, res, next) => {
    try {
        const {
            ma_nv, ho_ten, gioi_tinh,
            chuc_vu, so_dien_thoai, phong_ban_id
        } = req.body;

        if (!String(ma_nv || "").trim() || !String(ho_ten || "").trim()) {
            return res.status(400).json({
                error: "Mã nhân viên và họ tên là bắt buộc."
            });
        }

        const departmentId =
            phong_ban_id === "" || phong_ban_id == null
                ? null : Number(phong_ban_id);

        if (departmentId !== null &&
            (!Number.isInteger(departmentId) || departmentId <= 0)) {
            return res.status(400).json({ error: "Phòng ban không hợp lệ." });
        }

        const result = await pool.query(`
            INSERT INTO nhan_vien
                (ma_nv, ho_ten, gioi_tinh, chuc_vu,
                 so_dien_thoai, phong_ban_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            String(ma_nv).trim(), String(ho_ten).trim(),
            gioi_tinh || null, chuc_vu || null,
            so_dien_thoai || null, departmentId
        ]);

        res.status(201).json({
            message: "Thêm nhân viên thành công.",
            employee: result.rows[0]
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ error: "Mã nhân viên đã tồn tại." });
        }
        if (error.code === "23503") {
            return res.status(400).json({ error: "Phòng ban không tồn tại." });
        }
        next(error);
    }
});

// Sửa nhân viên: admin
app.put("/api/employees/:id", requireAdmin, async (req, res, next) => {
    try {
        const {
            ma_nv, ho_ten, gioi_tinh,
            chuc_vu, so_dien_thoai, phong_ban_id
        } = req.body;

        if (!String(ma_nv || "").trim() || !String(ho_ten || "").trim()) {
            return res.status(400).json({
                error: "Mã nhân viên và họ tên là bắt buộc."
            });
        }

        const departmentId =
            phong_ban_id === "" || phong_ban_id == null
                ? null : Number(phong_ban_id);

        if (departmentId !== null &&
            (!Number.isInteger(departmentId) || departmentId <= 0)) {
            return res.status(400).json({ error: "Phòng ban không hợp lệ." });
        }

        const result = await pool.query(`
            UPDATE nhan_vien
            SET ma_nv = $1, ho_ten = $2, gioi_tinh = $3,
                chuc_vu = $4, so_dien_thoai = $5, phong_ban_id = $6
            WHERE id = $7
            RETURNING *
        `, [
            String(ma_nv).trim(), String(ho_ten).trim(),
            gioi_tinh || null, chuc_vu || null,
            so_dien_thoai || null, departmentId,
            Number(req.params.id)
        ]);

        if (!result.rowCount) {
            return res.status(404).json({ error: "Không tìm thấy nhân viên." });
        }

        res.json({
            message: "Cập nhật nhân viên thành công.",
            employee: result.rows[0]
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ error: "Mã nhân viên đã tồn tại." });
        }
        if (error.code === "23503") {
            return res.status(400).json({ error: "Phòng ban không tồn tại." });
        }
        next(error);
    }
});

// Xóa nhân viên: admin
app.delete("/api/employees/:id", requireAdmin, async (req, res, next) => {
    try {
        const result = await pool.query(
            "DELETE FROM nhan_vien WHERE id = $1 RETURNING id",
            [Number(req.params.id)]
        );

        if (!result.rowCount) {
            return res.status(404).json({ error: "Không tìm thấy nhân viên." });
        }

        res.json({ message: "Xóa nhân viên thành công." });
    } catch (error) {
        next(error);
    }
});

// Xử lý lỗi chung
app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) return next(error);

    res.status(500).json({
        error: "Lỗi máy chủ. Kiểm tra Terminal để biết chi tiết."
    });
});

async function startServer() {
    try {
        await initDatabase();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`HRM đang chạy tại http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Không thể khởi động HRM:", error);
        process.exit(1);
    }
}

startServer();
