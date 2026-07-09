const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const User = require("../models/userModel");

passport.use(
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password"
        },
        async (email, password, done) => {
            try {
                const daskappUser = await User.findOne({ email: email.toLowerCase().trim() });

                if (!daskappUser) {
                    return done(null, false, { message: "Incorrect email or password." });
                }

                const isPasswordMatched = await bcrypt.compare(password, daskappUser.password);
                if (!isPasswordMatched) {
                    return done(null, false, { message: "Incorrect email or password." });
                }

                return done(null, daskappUser);
            } catch (error) {
                return done(error);
            }
        }
    )
);

passport.serializeUser((daskappUser, done) => {
    done(null, daskappUser._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const daskappUser = await User.findById(id).exec();
        done(null, daskappUser);
    } catch (error) {
        done(error);
    }
});

module.exports = passport;
