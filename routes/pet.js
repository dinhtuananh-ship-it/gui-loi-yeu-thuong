const express = require("express");
const db = require("../config/db");
const isLoggedIn = require("../middleware/auth");
const { species, items } = require("../config/pets");
const router = express.Router();
router.use(isLoggedIn, (req, res, next) => req.session.user.role === "user" ? next() : res.redirect("/admin"));

router.get("/pet", async (req, res, next) => {
    try {
        const [room, inventory] = await Promise.all([
            db.query("SELECT pet_species, equipped_item, coins FROM rooms WHERE id = $1", [req.session.user.room_id]),
            db.query("SELECT item_id FROM pet_inventory WHERE room_id = $1", [req.session.user.room_id])
        ]);
        if (!room.rows[0]) return res.sendStatus(404);
        res.render("pet", { pet: room.rows[0], inventory: new Set(inventory.rows.map(row => row.item_id)), species, items });
    } catch (err) { next(err); }
});

router.post("/pet/adopt", async (req, res, next) => {
    if (!Object.hasOwn(species, req.body.species)) return res.sendStatus(400);
    try {
        const result = await db.query("UPDATE rooms SET pet_species = $1 WHERE id = $2 AND pet_species IS NULL RETURNING id", [req.body.species, req.session.user.room_id]);
        if (!result.rowCount) req.session.flashError = "Phòng đã chọn thú cưng. Hai bạn cùng chăm sóc bé này nhé!";
        res.redirect("/pet");
    } catch (err) { next(err); }
});

router.post("/pet/buy", async (req, res, next) => {
    const item = items[req.body.item_id];
    if (!Object.hasOwn(items, req.body.item_id)) return res.sendStatus(400);
    const client = await db.connect().catch(next);
    if (!client) return;
    try {
        await client.query("BEGIN");
        const room = await client.query("SELECT coins, pet_species FROM rooms WHERE id = $1 FOR UPDATE", [req.session.user.room_id]);
        const owned = await client.query("SELECT 1 FROM pet_inventory WHERE room_id = $1 AND item_id = $2", [req.session.user.room_id, req.body.item_id]);
        if (!room.rows[0]?.pet_species || owned.rowCount || room.rows[0].coins < item.price) {
            await client.query("ROLLBACK");
            req.session.flashError = !room.rows[0]?.pet_species ? "Hãy chọn thú cưng trước." : owned.rowCount ? "Phòng đã sở hữu món đồ này." : "Chưa đủ xu để mua món đồ này.";
            return res.redirect("/pet#shop");
        }
        await client.query("UPDATE rooms SET coins = coins - $1, equipped_item = $2 WHERE id = $3", [item.price, req.body.item_id, req.session.user.room_id]);
        await client.query("INSERT INTO pet_inventory (room_id, item_id) VALUES ($1, $2)", [req.session.user.room_id, req.body.item_id]);
        await client.query("COMMIT");
        res.redirect("/pet#shop");
    } catch (err) { await client.query("ROLLBACK"); next(err); }
    finally { client.release(); }
});

router.post("/pet/equip", async (req, res, next) => {
    const itemId = req.body.item_id === "none" ? null : req.body.item_id;
    if (itemId !== null && !Object.hasOwn(items, itemId)) return res.sendStatus(400);
    try {
        const result = await db.query(`UPDATE rooms SET equipped_item = $1 WHERE id = $2 AND pet_species IS NOT NULL
            AND ($1::varchar IS NULL OR EXISTS (SELECT 1 FROM pet_inventory WHERE room_id = $2 AND item_id = $1)) RETURNING id`,
        [itemId, req.session.user.room_id]);
        if (!result.rowCount) req.session.flashError = "Bạn chưa sở hữu món đồ này.";
        res.redirect("/pet#shop");
    } catch (err) { next(err); }
});

module.exports = router;
