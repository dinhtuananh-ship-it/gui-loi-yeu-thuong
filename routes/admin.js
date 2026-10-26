const express = require("express");
const db = require("../config/db");
const isAdmin = require("../middleware/admin");
const router = express.Router();
router.use(isAdmin);

router.get("/", async (req, res, next) => {
    try {
        const [questions, rooms] = await Promise.all([
            db.query("SELECT * FROM questions ORDER BY id DESC"),
            db.query("SELECT count(*)::int AS total FROM rooms")
        ]);
        res.render("admin/dashboard", { questions: questions.rows, roomCount: rooms.rows[0].total });
    } catch (err) { next(err); }
});

router.get("/add", (req, res) => res.render("admin/add-question"));
router.post("/add", async (req, res, next) => {
    const question = String(req.body.question || "").trim();
    if (!question || question.length > 1000) {
        req.session.flashError = "Câu hỏi cần có nội dung và không quá 1000 ký tự.";
        return res.redirect("/admin/add");
    }
    try {
        await db.query("INSERT INTO questions (question, order_no) VALUES ($1, 1)", [question]);
        res.redirect("/admin");
    } catch (err) { next(err); }
});
router.get("/edit/:id", async (req, res, next) => {
    try {
        const { rows } = await db.query("SELECT * FROM questions WHERE id = $1", [req.params.id]);
        if (!rows[0]) return res.sendStatus(404);
        res.render("admin/edit-question", { question: rows[0] });
    } catch (err) { next(err); }
});
router.post("/edit/:id", async (req, res, next) => {
    const question = String(req.body.question || "").trim();
    if (!question || question.length > 1000) {
        req.session.flashError = "Câu hỏi cần có nội dung và không quá 1000 ký tự.";
        return res.redirect(`/admin/edit/${req.params.id}`);
    }
    try {
        await db.query("UPDATE questions SET question = $1 WHERE id = $2", [question, req.params.id]);
        res.redirect("/admin");
    } catch (err) { next(err); }
});
router.post("/delete/:id", async (req, res, next) => {
    try {
        await db.query("DELETE FROM questions WHERE id = $1", [req.params.id]);
        res.redirect("/admin");
    } catch (err) { next(err); }
});

router.get("/rooms", async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT r.*, count(u.id)::int AS member_count FROM rooms r
            LEFT JOIN users u ON u.room_id = r.id GROUP BY r.id ORDER BY r.id DESC`);
        res.render("admin/rooms", { rooms: rows });
    } catch (err) { next(err); }
});
router.get("/rooms/add", (req, res) => res.render("admin/add-room"));
router.post("/rooms/add", async (req, res, next) => {
    const code = String(req.body.room_code || "").trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,32}$/.test(code)) {
        req.session.flashError = "Mã phòng chỉ gồm 3-32 chữ cái, số hoặc dấu gạch ngang.";
        return res.redirect("/admin/rooms");
    }
    try {
        await db.query("INSERT INTO rooms (room_code) VALUES ($1)", [code]);
        res.redirect("/admin/rooms");
    } catch (err) {
        if (err.code === "23505") {
            req.session.flashError = "Mã phòng đã tồn tại.";
            return res.redirect("/admin/rooms");
        }
        next(err);
    }
});
router.post("/rooms/delete/:id", async (req, res, next) => {
    try {
        await db.query("DELETE FROM rooms WHERE id = $1", [req.params.id]);
        res.redirect("/admin/rooms");
    } catch (err) { next(err); }
});
module.exports = router;
