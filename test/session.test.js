const { test } = require("node:test");
const assert = require("node:assert/strict");

// Keep this test optional for environments without a configured database.
if (process.env.DATABASE_URL && process.env.SESSION_SECRET) {
    const app = require("../app");
    test("login form persists CSRF session and recovers from a missing cookie", async () => {
        const server = app.listen(0);
        try {
            const origin = `http://127.0.0.1:${server.address().port}`;
            const page = await fetch(`${origin}/login`);
            const html = await page.text();
            const token = html.match(/name="_csrf" value="([a-f0-9]{64})"/)[1];
            const cookie = page.headers.get("set-cookie").split(";")[0];
            assert.equal(page.headers.get("cache-control"), "no-store");
            const body = new URLSearchParams({ _csrf: token, username: "not-a-real-user", password: "wrong" });
            const valid = await fetch(`${origin}/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie }, body });
            assert.equal(valid.status, 401);
            assert.match(await valid.text(), /Tên đăng nhập hoặc mật khẩu không đúng/);
            const expired = await fetch(`${origin}/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
            assert.equal(expired.status, 403);
            assert.match(await expired.text(), /Phiên đăng nhập đã hết hạn/);
        } finally {
            await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
            await require("../config/db").end();
        }
    });
}
