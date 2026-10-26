const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const publicDir = path.join(__dirname, "../public");

test("manifest points to real installable icons", () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(publicDir, "manifest.webmanifest"), "utf8"));
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.start_url, "/");
    for (const icon of manifest.icons) {
        const image = fs.readFileSync(path.join(publicDir, icon.src.slice(1)));
        assert.equal(image.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
        const size = Number(icon.sizes.split("x")[0]);
        assert.equal(image.readUInt32BE(16), size);
        assert.equal(image.readUInt32BE(20), size);
    }
});

test("service worker only caches public assets and never stores navigation responses", () => {
    const sw = fs.readFileSync(path.join(publicDir, "sw.js"), "utf8");
    const assets = sw.match(/const STATIC_ASSETS = \[([\s\S]*?)\];/)[1].match(/"\/[^"]+"/g).map(value => JSON.parse(value));
    for (const asset of assets) assert.ok(fs.existsSync(path.join(publicDir, asset.slice(1))), `${asset} missing`);
    for (const privatePage of ["/", "/login", "/history", "/pet", "/memories"]) assert.ok(!assets.includes(privatePage));
    assert.match(sw, /request\.mode === "navigate"[\s\S]*?fetch\(request\)\.catch\(\(\) => caches\.match\("\/offline\.html"\)\)/);
    assert.doesNotMatch(sw, /cache\.put\(request,\s*response\)/);
});
