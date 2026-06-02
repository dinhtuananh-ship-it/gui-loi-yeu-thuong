const express = require("express");
const router = express.Router();

const db = require("../config/db");

/*
==================
MEMORIES
==================
*/

router.get("/memories", (req, res) => {

    db.query(
`
SELECT
memories.*,
users.username
FROM memories
JOIN users
ON users.id = memories.user_id
WHERE memories.room_id=?
ORDER BY memories.created_at DESC
`,
[
    req.session.user.room_id
],
(err,memories)=>{

            if (err) {
                return res.send(err);
            }

            res.render(
                "memories",
                {
                    memories,
                    user:req.session.user
                }
            );
        }
    );
});

/*
==================
ADD MEMORY
==================
*/

router.get("/memories/add", (req, res) => {

    res.render(
        "add-memory"
    );

});

router.post("/memories/add", (req, res) => {

    const {
        title,
        content
    } = req.body;

    db.query(
        `
        INSERT INTO memories
        (
            user_id,
            room_id,
            title,
            content
            
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
    req.session.user.id,
    req.session.user.room_id,
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