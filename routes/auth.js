const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../config/db");
const router = express.Router();

router.get("/login", (req, res) => res.render("login"));
router.get("/register", (req, res) => res.render("register"));

router.post("/login", async (req, res, next) => {
    try {
        const username = String(req.body.username || "").trim();
        const password = String(req.body.password || "");
        const { rows } = await db.query("SELECT id, username, password, role, room_id FROM users WHERE username = $1", [username]);
        if (!rows[0] || !(await bcrypt.compare(password, rows[0].password)))
            return res.status(401).render("login", { error: "Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm tra lại." });
        const user = rows[0];
        req.session.regenerate(err => {
            if (err) return next(err);
            req.session.user = { id: user.id, username: user.username, role: user.role, room_id: user.room_id };
            req.session.save(saveError => {
                if (saveError) return next(saveError);
                res.redirect(user.role === "admin" ? "/admin" : "/");
            });
        });
    } catch (err) { next(err); }
});

router.post("/register", async (req, res, next) => {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const code = String(req.body.room_code || "").trim().toUpperCase();
    const mode = req.body.mode;
    if (username.length < 3 || username.length > 50 || password.length < 8 || password.length > 128 || !/^[A-Z0-9-]{3,32}$/.test(code) || !["create", "join"].includes(mode)) {
        req.session.flashError = "Kiểm tra lại tên (3-50 ký tự), mật khẩu (8-128 ký tự) và mã phòng.";
        return res.redirect("/register");
    }
    const client = await db.connect().catch(next);
    if (!client) return;
    try {
        await client.query("BEGIN");
        let roomId;
        if (mode === "create") {
            const room = await client.query("INSERT INTO rooms (room_code) VALUES ($1) ON CONFLICT (room_code) DO NOTHING RETURNING id", [code]);
            if (!room.rows.length) {
                await client.query("ROLLBACK");
                req.session.flashError = "Mã phòng đã được sử dụng. Vui lòng chọn mã khác.";
                return res.redirect("/register");
            }
            roomId = room.rows[0].id;
        } else {
            const room = await client.query("SELECT id FROM rooms WHERE room_code = $1 FOR UPDATE", [code]);
            if (!room.rows.length) {
                await client.query("ROLLBACK");
                req.session.flashError = "Mã phòng không tồn tại.";
                return res.redirect("/register");
            }
            roomId = room.rows[0].id;
            const count = await client.query("SELECT count(*)::int AS total FROM users WHERE room_id = $1", [roomId]);
            if (count.rows[0].total >= 2) {
                await client.query("ROLLBACK");
                req.session.flashError = "Phòng này đã đủ hai người.";
                return res.redirect("/register");
            }
        }
        await client.query("INSERT INTO users (username, password, room_id) VALUES ($1, $2, $3)", [username, await bcrypt.hash(password, 12), roomId]);
        await client.query("COMMIT");
        res.redirect("/login");
    } catch (err) {
        await client.query("ROLLBACK");
        if (err.code === "23505") {
            req.session.flashError = "Tên đăng nhập đã được sử dụng.";
            return res.redirect("/register");
        }
        next(err);
    } finally { client.release(); }
});

router.post("/logout", (req, res, next) => req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.redirect("/login");
}));

module.exports = router;
