const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();
const db = require("../config/db");

/*
==================
LOGIN
==================
*/

router.get("/login", (req, res) => {
    res.render("login");
});

router.post("/login", (req, res) => {

    const {
        username,
        password
    } = req.body;

    db.query(
        "SELECT * FROM users WHERE username=?",
        [username],
        async (err, result) => {

            if (err) {
                return res.send(err);
            }

            if (result.length === 0) {
                return res.send("Tài khoản không tồn tại");
            }

            const user = result[0];

            const match =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!match) {
                return res.send("Sai mật khẩu");
            }

            req.session.user = {
                id: user.id,
                username: user.username,
                role: user.role,
                room_id: user.room_id
            };

            if (user.role === "admin") {
                return res.redirect("/admin");
            }

            res.redirect("/");
        }
    );
});

/*
==================
REGISTER
==================
*/

router.get("/register", (req, res) => {
    res.render("register");
});

router.post("/register", async (req, res) => {

    const {
        username,
        password,
        room_code
    } = req.body;

    const hash =
        await bcrypt.hash(password, 10);

    db.query(
        `
        SELECT *
        FROM rooms
        WHERE room_code=?
        `,
        [room_code],
        (err, roomResult) => {

            if (err) {
                return res.send(err);
            }

            if (roomResult.length === 0) {
                return res.send("Mã phòng không tồn tại");
            }

            const room =
                roomResult[0];

            db.query(
                `
                SELECT *
                FROM users
                WHERE room_id=?
                `,
                [room.id],
                (err2, users) => {

                    if (err2) {
                        return res.send(err2);
                    }

                    if (users.length >= 2) {
                        return res.send(
                            "Phòng đã đủ 2 người"
                        );
                    }

                    db.query(
                        `
                        INSERT INTO users
                        (
                            username,
                            password,
                            role,
                            room_id
                        )
                        VALUES
                        (
                            ?,
                            ?,
                            'user',
                            ?
                        )
                        `,
                        [
                            username,
                            hash,
                            room.id
                        ],
                        (err3) => {

                            if (err3) {
                                return res.send(err3);
                            }

                            res.redirect("/login");
                        }
                    );
                }
            );
        }
    );
});

/*
==================
LOGOUT
==================
*/

router.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/login");

    });

});

module.exports = router;