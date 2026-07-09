const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const connectDB = require("./config/db");
const passport = require("./middleware/passport");
const User = require("./models/userModel");

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use("/public", express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: "deskapp-passport-session-secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(async (req, res, next) => {
    if (req.user && req.user._id) {
        try {
            const freshUser = await User.findById(req.user._id);
            req.user = freshUser || req.user;
        } catch (error) {
            console.error("DeskApp user session refresh error", error);
        }
    }

    res.locals.currentUser = req.user || null;
    next();
});

app.use("/", require("./routes/index"));

app.listen(PORT, () => {
    console.log(`Server Running on : http://localhost:${PORT}`);
});
