const express = require("express");
const db = require("../config/db");
const isLoggedIn = require("../middleware/auth");
const router = express.Router();
router.use(isLoggedIn, (req, res, next) => req.session.user.role === "user" ? next() : res.redirect("/admin"));

router.get("/memories", async (req, res, next) => {
    try {
        const { rows } = await db.query(`SELECT m.*, u.username FROM memories m JOIN users u ON u.id = m.user_id
            WHERE m.room_id = $1 ORDER BY m.created_at DESC, m.id DESC`, [req.session.user.room_id]);
        res.render("memories", { memories: rows });
    } catch (err) { next(err); }
});
router.get("/memories/add", (req, res) => res.render("add-memory"));
router.post("/memories/add", async (req, res, next) => {
    const title = String(req.body.title || "").trim();
    const content = String(req.body.content || "").trim();
    if (!title || title.length > 150 || !content || content.length > 10000) {
        req.session.flashError = "Tiêu đề tối đa 150 ký tự, nội dung tối đa 10000 ký tự.";
        return res.redirect("/memories/add");
    }
    try {
        await db.query("INSERT INTO memories (user_id, room_id, title, content) VALUES ($1, $2, $3, $4)",
            [req.session.user.id, req.session.user.room_id, title, content]);
        res.redirect("/memories");
    } catch (err) { next(err); }
});
module.exports = router;
