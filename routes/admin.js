const express = require("express");
const router = express.Router();

const db = require("../config/db");
const isAdmin = require("../middleware/admin");

router.get("/", isAdmin, (req, res) => {

    db.query(
        "SELECT * FROM questions ORDER BY order_no ASC",
        (err, questions) => {

            if (err) {
                return res.send(err);
            }

            res.render("admin/dashboard", {
                questions,
                user: req.session.user
            });
        }
    );
});

router.get("/add", isAdmin, (req, res) => {
    res.render("admin/add-question");
});

router.post("/add", isAdmin, (req, res) => {

    const { question, order_no } = req.body;

    db.query(
        "INSERT INTO questions(question,order_no) VALUES(?,?)",
        [question, order_no],
        (err) => {

            if (err) {
                return res.send(err);
            }

            res.redirect("/admin");
        }
    );
});

router.get("/edit/:id", isAdmin, (req, res) => {

    db.query(
        "SELECT * FROM questions WHERE id=?",
        [req.params.id],
        (err, result) => {

            if (err) {
                return res.send(err);
            }

            res.render(
                "admin/edit-question",
                {
                    question: result[0]
                }
            );
        }
    );
});

router.post("/edit/:id", isAdmin, (req, res) => {

    const { question, order_no } = req.body;

    db.query(
        `
        UPDATE questions
        SET question=?,
            order_no=?
        WHERE id=?
        `,
        [
            question,
            order_no,
            req.params.id
        ],
        (err) => {

            if (err) {
                return res.send(err);
            }

            res.redirect("/admin");
        }
    );
});

router.get("/delete/:id", isAdmin, (req, res) => {

    db.query(
        "DELETE FROM questions WHERE id=?",
        [req.params.id],
        (err) => {

            if (err) {
                return res.send(err);
            }

            res.redirect("/admin");
        }
    );
});

/* =====================
   ROOMS
===================== */

router.get("/rooms", isAdmin, (req, res) => {

    db.query(
        `
        SELECT
            r.*,
            COUNT(u.id) AS total_users
        FROM rooms r
        LEFT JOIN users u
            ON u.room_id = r.id
        GROUP BY r.id
        ORDER BY r.id DESC
        `,
        (err, rooms) => {

            if (err) {
                return res.send(err);
            }

            res.render(
                "admin/rooms",
                {
                    rooms,
                    user: req.session.user
                }
            );
        }
    );
});

router.get("/rooms/add", isAdmin, (req, res) => {

    res.render(
        "admin/add-room"
    );

});

router.post("/rooms/add", isAdmin, (req, res) => {

    const {
        room_name,
        room_code
    } = req.body;

    db.query(
        `
        INSERT INTO rooms
        (
            room_name,
            room_code
        )
        VALUES
        (
            ?,
            ?
        )
        `,
        [
            room_name,
            room_code
        ],
        (err) => {

            if (err) {
                return res.send(err);
            }

            res.redirect("/admin/rooms");
        }
    );
});

router.get(
    "/rooms/delete/:id",
    isAdmin,
    (req, res) => {

        db.query(
            `
            DELETE FROM rooms
            WHERE id=?
            `,
            [req.params.id],
            (err) => {

                if (err) {
                    return res.send(err);
                }

                res.redirect(
                    "/admin/rooms"
                );
            }
        );
    }
);

module.exports = router;