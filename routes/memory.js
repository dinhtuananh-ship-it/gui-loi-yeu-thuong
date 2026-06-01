const express = require("express");
const router = express.Router();

const db = require("../config/db");

router.get("/memories", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    db.query(
        `
        SELECT
        memories.*,
        users.username
        FROM memories
        JOIN users
        ON users.id = memories.user_id
        ORDER BY memories.created_at DESC
        `,
        (err, memories) => {

            if (err) {
                return res.send(err);
            }

            res.render(
                "memories",
                {
                    memories,
                    user: req.session.user
                }
            );
        }
    );
});

router.get("/memories/add", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    res.render("add-memory");
});

router.post("/memories/add", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    const {
        title,
        content
    } = req.body;

    db.query(
        `
        INSERT INTO memories
        (
            user_id,
            title,
            content
        )
        VALUES
        (
            ?,
            ?,
            ?
        )
        `,
        [
            req.session.user.id,
            title,
            content
        ],
        (err) => {

            if (err) {
                return res.send(err);
            }

            res.redirect("/memories");
        }
    );
});

module.exports = router;