const express = require("express");
const router = express.Router();

const db = require("../config/db");
const isAdmin = require("../middleware/admin");

/*
========================
Dashboard
========================
*/

router.get("/", isAdmin, (req, res) => {

    db.query(
        "SELECT * FROM questions ORDER BY order_no ASC",
        (err, questions) => {

            if (err) {
                return res.send(err);
            }

            db.query(
                "SELECT * FROM rooms ORDER BY id DESC",
                (err2, rooms) => {

                    if (err2) {
                        return res.send(err2);
                    }

                    res.render(
                        "admin/dashboard",
                        {
                            questions,
                            rooms,
                            user: req.session.user
                        }
                    );
                }
            );
        }
    );
});

/*
========================
QUESTION CRUD
========================
*/

router.get("/add", isAdmin, (req, res) => {
    res.render("admin/add-question");
});

router.post("/add", isAdmin, (req, res) => {

    const {
        question,
        order_no
    } = req.body;

    db.query(
        `
        INSERT INTO questions
        (
            question,
            order_no
        )
        VALUES
        (
            ?,
            ?
        )
        `,
        [
            question,
            order_no
        ],
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

    const {
        question,
        order_no
    } = req.body;

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

/*
========================
ROOM CRUD
========================
*/

router.get("/rooms/add", isAdmin, (req, res) => {

    res.render("admin/add-room");

});

router.post("/rooms/add", isAdmin, (req, res) => {

    const room_name = req.body.room_name;

    const room_code =
        room_name.toUpperCase()
        + "-"
        + Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase();

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

            res.redirect("/admin");
        }
    );
});

router.get("/rooms/delete/:id", isAdmin, (req, res) => {

    db.query(
        "DELETE FROM rooms WHERE id=?",
        [req.params.id],
        (err) => {

            if (err) {
                return res.send(err);
            }

            res.redirect("/admin");
        }
    );
});

module.exports = router;