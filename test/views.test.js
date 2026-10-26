const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const ejs = require("ejs");
const { species, items } = require("../config/pets");

const base = { csrfToken: "test-token", user: { username: "Mai" }, error: null };
const views = path.join(__dirname, "../views");

async function render(view, locals = {}) {
    return ejs.renderFile(path.join(views, `${view}.ejs`), { ...base, ...locals });
}

test("all public and admin pages render without a database", async () => {
    const members = [{ id: "1", username: "Mai" }, { id: "2", username: "An" }];
    const cases = [
        ["login"], ["register"], ["home", { room: { room_code: "LOVE001", members: members.slice(0, 1) }, question: { id: 1, question: "Điều gì làm bạn vui?", answered: false }, ownAnswer: null, latest: null, completed: 0, total: 1 }],
        ["home", { room: { room_code: "LOVE001", members }, question: { id: 1, question: "Điều gì làm bạn vui?", answered: true }, ownAnswer: "Một cái ôm", latest: null, completed: 0, total: 1 }],
        ["home", { room: { room_code: "LOVE001", members }, question: undefined, ownAnswer: null, latest: { question: "Điều gì làm bạn vui?", answers: [{ user_id: "1", username: "Mai", answer: "Một cái ôm" }, { user_id: "2", username: "An", answer: "Cùng ăn tối" }] }, completed: 1, total: 1 }],
        ["home", { room: { room_code: "LOVE001", members: [] }, question: undefined, ownAnswer: null, latest: null, completed: 0, total: 0 }],
        ["pet", { pet: { coins: 0, pet_species: null, equipped_item: null }, inventory: new Set(), species, items }],
        ["pet", { pet: { coins: 150, pet_species: "cat", equipped_item: "bow" }, inventory: new Set(["bow"]), species, items }],
        ["history", { grouped: [] }], ["memories", { memories: [] }], ["add-memory"],
        ["admin/dashboard", { questions: [], roomCount: 0 }], ["admin/rooms", { rooms: [] }],
        ["admin/add-question"], ["admin/edit-question", { question: { id: 1, question: "Lời nhắn?", order_no: 1 } }], ["admin/add-room"]
    ];
    for (const [view, locals] of cases) {
        const html = await render(view, locals);
        assert.match(html, /<html lang="vi">/);
        assert.match(html, /name="viewport"/);
    }
});

test("unfinished question hides submitted answers from both members", async () => {
    const room = { room_code: "LOVE001", members: [{ id: "1", username: "Mai" }, { id: "2", username: "An" }] };
    for (const viewer of [{ id: "1", username: "Mai" }, { id: "2", username: "An" }]) {
        const html = await render("home", { user: viewer, room, question: { id: "7", question: "Bí mật?", answered: viewer.id === "1" }, ownAnswer: viewer.id === "1" ? "Lời nhắn bí mật chỉ một người đã gửi" : null, latest: null, completed: 0, total: 1 });
        if (viewer.id === "1") {
            assert.match(html, /Lời nhắn bí mật chỉ một người đã gửi/);
            assert.match(html, /Sửa câu trả lời/);
        } else {
            assert.doesNotMatch(html, /Lời nhắn bí mật chỉ một người đã gửi/);
            assert.doesNotMatch(html, /Sửa câu trả lời/);
        }
        assert.match(html, /Lời nhắn đang được giữ kín/);
        assert.match(html, /Bí mật\?/);
    }
});

test("completed answers appear in separate cards for either viewer", async () => {
    const room = { room_code: "LOVE001", members: [{ id: "1", username: "Mai" }, { id: "2", username: "An" }] };
    const latest = { question: "Kỷ niệm nào?", answers: [{ user_id: "1", username: "Mai", answer: "Ngày đầu tiên" }, { user_id: "2", username: "An", answer: "Ngày gặp nhau" }] };
    for (const viewer of room.members) {
        const html = await render("home", { user: viewer, room, question: undefined, ownAnswer: null, latest, completed: 1, total: 1 });
        assert.match(html, /Ngày đầu tiên/);
        assert.match(html, /Ngày gặp nhau/);
        assert.equal((html.match(/class="revealed-text"/g) || []).length, 2);
        assert.doesNotMatch(html, /Sửa câu trả lời/);
    }
});

test("pet shop reflects ownership and available coins", async () => {
    const html = await render("pet", { pet: { coins: 100, pet_species: "dog", equipped_item: "bow" }, inventory: new Set(["bow"]), species, items });
    assert.match(html, /Đang mặc/);
    assert.match(html, /Cún con/);
    assert.match(html, /\/img\/pets\.svg#dog/);
    assert.match(html, /disabled/);
    assert.match(html, /100/);
});

test("user content is escaped in HTML and not interpolated into scripts", async () => {
    const unsafe = '<script>alert("x")</script>`';
    const html = await render("memories", { memories: [{ id: 1, title: unsafe, content: unsafe, username: unsafe, created_at: new Date() }] });
    assert.doesNotMatch(html, /<script>alert/);
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /onclick=/);
});

test("login displays invalid credentials without a silent redirect", async () => {
    const html = await render("login", { error: "Tên đăng nhập hoặc mật khẩu không đúng." });
    assert.match(html, /role="alert"/);
    assert.match(html, /Tên đăng nhập hoặc mật khẩu không đúng/);
    assert.match(html, /cửa sổ ẩn danh/);
});

test("admin edits question text without choosing a display order", async () => {
    for (const view of ["admin/add-question", "admin/edit-question"]) {
        const html = await render(view, { question: { id: 1, question: "Lời nhắn?" } });
        assert.match(html, /name="question"/);
        assert.doesNotMatch(html, /name="order_no"/);
    }
});
