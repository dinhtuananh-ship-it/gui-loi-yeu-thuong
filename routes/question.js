const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Lấy câu hỏi hiện tại
router.get("/", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    const roomId = req.session.user.room_id;

    db.query(
        "SELECT * FROM questions ORDER BY order_no ASC",
        async (err, questions) => {

            if (err) {
                return res.send(err);
            }

            if (questions.length === 0) {
                return res.render("home", {
                    question: null,
                    waiting: false,
                    completed: true,
                    user: req.session.user
                });
            }

            let currentQuestion = null;
            let waiting = false;

            for (let q of questions) {

                const answers = await getAnswers(q.id);

                if (answers.length < 2) {

                    currentQuestion = q;

                    const myAnswer =
                        answers.find(
                            a => a.user_id === req.session.user.id
                        );

                    if (myAnswer) {
                        waiting = true;
                    }

                    break;
                }
            }

            if (!currentQuestion) {
                return res.render("home", {
                    question: null,
                    waiting: false,
                    completed: true,
                    user: req.session.user
                });
            }

            res.render("home", {
                question: currentQuestion,
                waiting,
                completed: false,
                user: req.session.user

            });

        }
    );
});

function getAnswers(questionId) {

    return new Promise((resolve, reject) => {

        db.query(
            `
            SELECT *
            FROM answers
            WHERE question_id=?
            `,
            [questionId],
            (err, result) => {

                if (err) {
                    reject(err);
                }

                resolve(result);
            }
        );
    });
}

// Lưu câu trả lời

router.post("/answer", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    const {
        question_id,
        answer
    } = req.body;

    db.query(
        `
        SELECT *
        FROM answers
        WHERE question_id=?
        AND user_id=?
        `,
        [
            question_id,
            req.session.user.id
        ],
        (err, exist) => {

            if (err) {
                return res.send(err);
            }

            if (exist.length > 0) {
                return res.redirect("/");
            }

            db.query(
                `
                INSERT INTO answers
                (
                    question_id,
                    user_id,
                    answer
                )
                VALUES (?,?,?)
                `,
                [
                    question_id,
                    req.session.user.id,
                    answer
                ],
                (err2) => {

                    if (err2) {
                        return res.send(err2);
                    }

                    res.redirect("/");
                }
            );
        }
    );
});
router.get("/history", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    db.query(
        `
        SELECT
        q.question,
        a.answer,
        u.username
        FROM answers a
        JOIN questions q
            ON q.id = a.question_id
        JOIN users u
            ON u.id = a.user_id
        ORDER BY q.order_no
        `,
        (err, result) => {

            if (err) {
                return res.send(err);
            }

            res.render(
    "history",
    {
        answers: result,
        user: req.session.user
    }
);
        }
    );
});
module.exports = router;