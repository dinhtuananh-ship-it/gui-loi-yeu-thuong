require("dotenv").config();
const express = require("express");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const crypto = require("crypto");
const path = require("path");
const db = require("./config/db");

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters. See .env.example.");
}

const app = express();
app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
    store: new PgSession({ pool: db, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 24 * 14 }
}));

app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

app.use((req, res, next) => {
    const newToken = !req.session.csrfToken;
    if (newToken) req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    res.locals.csrfToken = req.session.csrfToken;
    res.locals.user = req.session.user || null;
    res.locals.error = req.session.flashError || null;
    delete req.session.flashError;
    if (req.method !== "POST") {
        // Persist the anonymous session before sending an HTML form and its token.
        if (newToken) return req.session.save(next);
        return next();
    }
    const token = req.body._csrf;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token) ||
        !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(req.session.csrfToken))) {
        if (req.path === "/login" || req.path === "/register") {
            return req.session.save(err => {
                if (err) return next(err);
                res.status(403).render(req.path.slice(1), {
                    error: "Phiên đăng nhập đã hết hạn. Vui lòng nhập lại thông tin và thử lần nữa."
                });
            });
        }
        return res.status(403).send("Phiên biểu mẫu đã hết hạn. Vui lòng tải lại trang và thử lại.");
    }
    next();
});

app.use("/", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/", require("./routes/question"));
app.use("/", require("./routes/memory"));
app.use("/", require("./routes/pet"));
app.use((req, res) => res.status(404).send("Không tìm thấy trang."));
app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);
    res.status(500).send("Có lỗi xảy ra. Vui lòng thử lại sau.");
});

if (require.main === module) {
    app.listen(process.env.PORT || 3000, () => console.log(`Server listening on port ${process.env.PORT || 3000}`));
}
module.exports = app;
