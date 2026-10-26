const { test } = require("node:test");
const assert = require("node:assert/strict");

// Keep this test optional for environments without a configured database.
if (process.env.DATABASE_URL && process.env.SESSION_SECRET) {
    const app = require("../app");
    test("login accepts a signed form without an anonymous session cookie", async () => {
        const server = app.listen(0);
        try {
            const origin = `http://127.0.0.1:${server.address().port}`;
            const page = await fetch(`${origin}/login`);
            const html = await page.text();
            const token = html.match(/name="_csrf" value="([a-z0-9]+\.[a-f0-9]{64})"/)[1];
            assert.equal(page.headers.get("cache-control"), "no-store");
            const body = new URLSearchParams({ _csrf: token, username: "not-a-real-user", password: "wrong" });
            const valid = await fetch(`${origin}/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
            assert.equal(valid.status, 401);
            assert.match(await valid.text(), /Tên đăng nhập hoặc mật khẩu không đúng/);
            const invalid = await fetch(`${origin}/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ _csrf: "bad", username: "someone", password: "bad" }) });
            assert.equal(invalid.status, 403);
            assert.match(await invalid.text(), /Biểu mẫu đã hết hạn/);
            const crossSite = await fetch(`${origin}/login`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", origin: "https://attacker.example" }, body });
            assert.equal(crossSite.status, 403);
        } finally {
            await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
            await require("../config/db").end();
        }
    });
}
