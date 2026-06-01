const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();

require("./config/db");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    session({
        secret: "gui-loi-yeu-thuong-secret",
        resave: false,
        saveUninitialized: false
    })
);

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/", require("./routes/question"));

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});