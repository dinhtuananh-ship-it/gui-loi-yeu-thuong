const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();

const db = require("../config/db");

router.get("/login", (req, res) => {
    res.render("login");
});

router.get("/register", (req, res) => {
    res.render("register");
});

router.post("/register", async (req, res) => {

    const {
        username,
        password,
        room_code
    } = req.body;

    try {

        db.query(
            "SELECT * FROM rooms WHERE room_code=?",
            [room_code],
            async (err, roomResult) => {

                if(err){
                    return res.send(err);
                }

                let roomId;

                if(roomResult.length === 0){

                    db.query(
                        "INSERT INTO rooms(room_code) VALUES(?)",
                        [room_code],
                        async (err2, roomInsert) => {

                            if(err2){
                                return res.send(err2);
                            }

                            roomId = roomInsert.insertId;

                            saveUser(roomId);
                        }
                    );

                }else{

                    roomId = roomResult[0].id;

                    saveUser(roomId);
                }

                async function saveUser(roomId){

                    const hash =
                        await bcrypt.hash(password,10);

                    db.query(
                        `
                        INSERT INTO users
                        (username,password,room_id)
                        VALUES(?,?,?)
                        `,
                        [
                            username,
                            hash,
                            roomId
                        ],
                        (err3)=>{

                            if(err3){
                                return res.send(err3);
                            }

                            res.redirect("/login");
                        }
                    );
                }
            }
        );

    } catch(error){

        console.log(error);

        res.send("Lỗi đăng ký");
    }
});

router.post("/login",(req,res)=>{

    const {
        username,
        password
    } = req.body;

    db.query(
        "SELECT * FROM users WHERE username=?",
        [username],
        async(err,result)=>{

            if(err){
                return res.send(err);
            }

            if(result.length === 0){

                return res.send(
                    "Sai tài khoản"
                );
            }

            const user = result[0];

            const match =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if(!match){

                return res.send(
                    "Sai mật khẩu"
                );
            }

            req.session.user = {

                id:user.id,
                username:user.username,
                role:user.role,
                room_id:user.room_id
            };

            if(user.role==="admin"){

                return res.redirect(
                    "/admin"
                );
            }

            res.redirect("/");
        }
    );
});

router.get("/logout",(req,res)=>{

    req.session.destroy(()=>{

        res.redirect("/login");
    });
});

module.exports = router;