const express = require("express");
const router = express.Router();

const db = require("../config/db");

/*
==================
HOME
==================
*/

router.get("/", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    const roomId =
        req.session.user.room_id;

    db.query(
        "SELECT * FROM questions ORDER BY order_no ASC",
        async (err, questions) => {

            if (err) {
                return res.send(err);
            }

            let currentQuestion = null;
            let waiting = false;

            for (let q of questions) {

                const answers =
                    await getAnswers(
                        q.id,
                        roomId
                    );

                if (answers.length < 2) {

                    currentQuestion = q;

                    const myAnswer =
                        answers.find(
                            a =>
                            a.user_id ===
                            req.session.user.id
                        );

                    if (myAnswer) {
                        waiting = true;
                    }

                    break;
                }
            }

            res.render(
                "home",
                {
                    question: currentQuestion,
                    waiting,
                    user: req.session.user
                }
            );
        }
    );
});

function getAnswers(questionId, roomId){

    return new Promise((resolve,reject)=>{

        db.query(
            `
            SELECT *
            FROM answers
            WHERE question_id=?
            AND room_id=?
            `,
            [questionId, roomId],
            (err,result)=>{

                if(err){
                    reject(err);
                }

                resolve(result);

            }
        );

    });

}

/*
==================
ANSWER
==================
*/

router.post("/answer", (req, res) => {

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

            if (exist.length > 0) {
                return res.redirect("/");
            }

            db.query(
                `
                INSERT INTO answers
                (
                    question_id,
                    user_id,
                    answer,
                    room_id
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?
                )
                `,
                [
                    question_id,
                    req.session.user.id,
                    answer,
                    req.session.user.room_id
                ],
                () => {

                    res.redirect("/");

                }
            );
        }
    );
});

/*
==================
HISTORY
==================
*/

router.get("/history",(req,res)=>{

    if(!req.session.user){
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
            ON q.id=a.question_id

        JOIN users u
            ON u.id=a.user_id

        WHERE a.room_id=?

        ORDER BY q.order_no
        `,
        [
            req.session.user.room_id
        ],
        (err,result)=>{

            if(err){
                return res.send(err);
            }

            res.render(
                "history",
                {
                    answers:result,
                    user:req.session.user
                }
            );

        }
    );

});
module.exports = router;