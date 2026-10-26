require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("../config/db");

async function main() {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 12) {
        throw new Error("Set ADMIN_USERNAME and ADMIN_PASSWORD (at least 12 characters) in .env");
    }
    await db.query(fs.readFileSync(path.join(__dirname, "../schema.sql"), "utf8"));
    const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await db.query(
        "INSERT INTO users (username, password, role) VALUES ($1, $2, 'admin') ON CONFLICT (username) DO NOTHING",
        [process.env.ADMIN_USERNAME.trim(), password]
    );
    console.log("Database ready. Admin account created if it did not exist.");
}

main().catch(err => { console.error(err); process.exitCode = 1; }).finally(() => db.end());
