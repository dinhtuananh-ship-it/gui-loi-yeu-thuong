const express = require("express");
const db = require("../config/db");
const isLoggedIn = require("../middleware/auth");
const router = express.Router();
router.use(isLoggedIn);

async function progress(roomId, userId, connection = db) {
    const { rows } = await connection.query(`
        SELECT q.id, q.question,
            count(a.id)::int AS answer_count,
            bool_or(a.user_id = $2) AS answered
        FROM questions q LEFT JOIN answers a ON a.question_id = q.id AND a.room_id = $1
        GROUP BY q.id
        ORDER BY CASE WHEN count(a.id) = 1 THEN 0 ELSE 1 END,
            md5($1::text || ':' || q.id::text)`, [roomId, userId]);
    return rows;
}

router.get("/", async (req, res, next) => {
    try {
        if (req.session.user.role === "admin") return res.redirect("/admin");
        const questions = await progress(req.session.user.room_id, req.session.user.id);
        const current = questions.find(q => q.answer_count < 2);
        const completedQuestions = questions.filter(q => q.answer_count === 2);
        const latestResult = completedQuestions.length ? await db.query(`SELECT q.id, q.question FROM questions q
            JOIN answers a ON a.question_id = q.id AND a.room_id = $1
            GROUP BY q.id HAVING count(a.id) = 2
            ORDER BY max(a.created_at) DESC, q.id DESC LIMIT 1`, [req.session.user.room_id]) : { rows: [] };
        const latest = latestResult.rows[0];
        const [room, members, revealed, own] = await Promise.all([
            db.query("SELECT room_code FROM rooms WHERE id = $1", [req.session.user.room_id]),
            db.query("SELECT id, username FROM users WHERE room_id = $1 ORDER BY id", [req.session.user.room_id]),
            latest ? db.query(`SELECT a.answer, u.username, u.id AS user_id FROM answers a
                JOIN users u ON u.id = a.user_id WHERE a.room_id = $1 AND a.question_id = $2 ORDER BY u.id`,
            [req.session.user.room_id, latest.id]) : Promise.resolve({ rows: [] }),
            current ? db.query("SELECT answer FROM answers WHERE room_id = $1 AND question_id = $2 AND user_id = $3",
                [req.session.user.room_id, current.id, req.session.user.id]) : Promise.resolve({ rows: [] })
        ]);
        res.render("home", { question: current, completed: completedQuestions.length,
            total: questions.length, room: { ...room.rows[0], members: members.rows },
            ownAnswer: own.rows[0]?.answer || null, latest: latest ? { question: latest.question, answers: revealed.rows } : null });
    } catch (err) { next(err); }
});

router.post("/answer", async (req, res, next) => {
    if (req.session.user.role !== "user") return res.sendStatus(403);
    const answer = String(req.body.answer || "").trim();
    if (!answer || answer.length > 5000) {
        req.session.flashError = "Câu trả lời cần có nội dung và không quá 5000 ký tự.";
        return res.redirect("/");
    }
    const client = await db.connect().catch(next);
    if (!client) return;
    try {
        await client.query("BEGIN");
        await client.query("SELECT id FROM rooms WHERE id = $1 FOR UPDATE", [req.session.user.room_id]);
        const questions = await progress(req.session.user.room_id, req.session.user.id, client);
        const current = questions.find(q => q.answer_count < 2);
        if (!current || String(current.id) !== String(req.body.question_id)) {
            await client.query("ROLLBACK");
            req.session.flashError = "Câu hỏi đã thay đổi. Vui lòng thử lại.";
            return res.redirect("/");
        }
        if (current.answered) {
            await client.query("UPDATE answers SET answer = $1 WHERE room_id = $2 AND question_id = $3 AND user_id = $4",
                [answer, req.session.user.room_id, current.id, req.session.user.id]);
        } else {
            const inserted = await client.query(`INSERT INTO answers (question_id, user_id, room_id, answer)
                VALUES ($1, $2, $3, $4) ON CONFLICT (question_id, user_id) DO NOTHING RETURNING id`,
            [current.id, req.session.user.id, req.session.user.room_id, answer]);
            if (inserted.rowCount) await client.query("UPDATE rooms SET coins = coins + 100 WHERE id = $1", [req.session.user.room_id]);
        }
        await client.query("COMMIT");
        res.redirect("/");
    } catch (err) { await client.query("ROLLBACK"); next(err); }
    finally { client.release(); }
});

router.get("/history", async (req, res, next) => {
    try {
        if (req.session.user.role !== "user") return res.redirect("/admin");
        const { rows } = await db.query(`SELECT q.id, q.question, q.order_no, a.answer, u.username, a.created_at
            FROM questions q JOIN answers a ON a.question_id = q.id AND a.room_id = $1
            JOIN users u ON u.id = a.user_id
            WHERE (SELECT count(*) FROM answers complete WHERE complete.room_id = $1 AND complete.question_id = q.id) = 2
            ORDER BY (SELECT max(done.created_at) FROM answers done WHERE done.room_id = $1 AND done.question_id = q.id),
                q.id, a.created_at`, [req.session.user.room_id]);
        const grouped = [];
        for (const row of rows) {
            if (grouped.at(-1)?.id !== row.id) grouped.push({ id: row.id, question: row.question, answers: [] });
            grouped.at(-1).answers.push(row);
        }
        res.render("history", { grouped });
    } catch (err) { next(err); }
});

module.exports = router;
