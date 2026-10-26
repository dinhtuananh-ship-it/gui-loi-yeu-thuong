const crypto = require("node:crypto");

const lifetime = 30 * 60 * 1000;

function signature(timestamp) {
    return crypto.createHmac("sha256", process.env.SESSION_SECRET)
        .update(`public-form:${timestamp}`).digest("hex");
}

function createToken() {
    const timestamp = Date.now().toString(36);
    return `${timestamp}.${signature(timestamp)}`;
}

function verifyToken(token) {
    if (typeof token !== "string" || !/^[a-z0-9]+\.[a-f0-9]{64}$/.test(token)) return false;
    const [timestamp, mac] = token.split(".");
    const age = Date.now() - parseInt(timestamp, 36);
    if (!Number.isFinite(age) || age < 0 || age > lifetime) return false;
    return crypto.timingSafeEqual(Buffer.from(mac, "hex"), Buffer.from(signature(timestamp), "hex"));
}

module.exports = { createToken, verifyToken };
