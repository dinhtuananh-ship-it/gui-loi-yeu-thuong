const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createToken, verifyToken } = require("../middleware/form-token");

test("public form tokens are signed and expire", () => {
    const oldSecret = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = "test-secret-long-enough-to-sign-form-tokens";
    try {
        const token = createToken();
        assert.equal(verifyToken(token), true);
        assert.equal(verifyToken(token.slice(0, -1) + (token.endsWith("0") ? "1" : "0")), false);
        assert.equal(verifyToken("bad"), false);
        const oldTime = Date.now;
        try {
            Date.now = () => oldTime() + 31 * 60 * 1000;
            assert.equal(verifyToken(token), false);
        } finally { Date.now = oldTime; }
    } finally { process.env.SESSION_SECRET = oldSecret; }
});
