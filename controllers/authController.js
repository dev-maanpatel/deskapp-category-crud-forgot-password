const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const passport = require("../middleware/passport");
const mongoose = require("mongoose");

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,15}$/;
    return passwordRegex.test(password);
};

const passwordMessage = "Password must be 8 to 15 characters long and include at least one uppercase letter and one special character.";

const loginPage = (req, res) => {
    res.render("auth/signin", {
        title: "DeskApp | Sign In",
        error: null,
        success: req.query.success || null
    });
};

const registerPage = (req, res) => {
    res.render("auth/signup", { title: "DeskApp | Sign Up", error: null });
};

const signUp = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        name = name ? name.trim() : "";
        email = email ? email.toLowerCase().trim() : "";
        password = password ? password.trim() : "";

        if (!name || !email || !password) {
            return res.render("auth/signup", { title: "DeskApp | Sign Up", error: "Please fill in all required fields." });
        }

        if (!isValidEmail(email)) {
            return res.render("auth/signup", { title: "DeskApp | Sign Up", error: "Please enter a valid email address." });
        }

        if (!isValidPassword(password)) {
            return res.render("auth/signup", { title: "DeskApp | Sign Up", error: passwordMessage });
        }

        const existUser = await User.findOne({ email });
        if (existUser) {
            return res.render("auth/signup", { title: "DeskApp | Sign Up", error: "An account with this email already exists." });
        }

        const hashPassword = await bcrypt.hash(password, 12);

        await User.create({ name, email, password: hashPassword });
        return res.redirect("/signin");
    } catch (error) {
        console.error("DeskApp signup error", error);
        return res.render("auth/signup", { title: "DeskApp | Sign Up", error: "Unable to create your account." });
    }
};

const signIn = (req, res, next) => {
    let { email, password } = req.body;

    email = email ? email.toLowerCase().trim() : "";
    password = password ? password.trim() : "";

    if (!email || !password) {
        return res.render("auth/signin", { title: "DeskApp | Sign In", error: "Please enter email and password.", success: null });
    }

    if (!isValidEmail(email)) {
        return res.render("auth/signin", { title: "DeskApp | Sign In", error: "Please enter a valid email address.", success: null });
    }

    if (!isValidPassword(password)) {
        return res.render("auth/signin", { title: "DeskApp | Sign In", error: passwordMessage, success: null });
    }

    req.body.email = email;
    req.body.password = password;

    passport.authenticate("local", (err, user, info) => {
        if (err) {
            console.error("DeskApp signin error", err);
            return res.render("auth/signin", { title: "DeskApp | Sign In", error: "Sign in failed. Please try again.", success: null });
        }

        if (!user) {
            return res.render("auth/signin", {
                title: "DeskApp | Sign In",
                error: info?.message || "Incorrect email or password.",
                success: null
            });
        }

        req.logIn(user, (loginErr) => {
            if (loginErr) {
                console.error("DeskApp login session error", loginErr);
                return res.render("auth/signin", { title: "DeskApp | Sign In", error: "Sign in failed. Please try again.", success: null });
            }

            return res.redirect("/dashboard");
        });
    })(req, res, next);
};

const forgotPasswordPage = (req, res) => {
    return res.render("auth/forgot-password", {
        title: "DeskApp | Forgot Password",
        error: null,
        email: ""
    });
};

const verifyForgotEmail = async (req, res) => {
    try {
        let { email } = req.body;
        email = email ? email.toLowerCase().trim() : "";

        if (!email) {
            return res.render("auth/forgot-password", {
                title: "DeskApp | Forgot Password",
                error: "Please enter your registered email address.",
                email
            });
        }

        if (!isValidEmail(email)) {
            return res.render("auth/forgot-password", {
                title: "DeskApp | Forgot Password",
                error: "Please enter a valid email address.",
                email
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.render("auth/forgot-password", {
                title: "DeskApp | Forgot Password",
                error: "This email is not registered. Please enter your registered email.",
                email
            });
        }

        return res.redirect(`/reset-password/${user._id}`);
    } catch (error) {
        console.error("DeskApp forgot password email check error", error);
        return res.render("auth/forgot-password", {
            title: "DeskApp | Forgot Password",
            error: "Unable to check email. Please try again.",
            email: req.body.email || ""
        });
    }
};

const resetPasswordPage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.redirect("/forgot-password");
        }

        const user = await User.findById(id).select("_id email");
        if (!user) {
            return res.redirect("/forgot-password");
        }

        return res.render("auth/reset-password", {
            title: "DeskApp | Reset Password",
            error: null,
            userId: user._id,
            email: user.email
        });
    } catch (error) {
        console.error("DeskApp reset password page error", error);
        return res.redirect("/forgot-password");
    }
};

const resetPassword = async (req, res) => {
    try {
        let { userId, newPassword, confirmPassword } = req.body;

        userId = userId ? userId.trim() : "";
        newPassword = newPassword ? newPassword.trim() : "";
        confirmPassword = confirmPassword ? confirmPassword.trim() : "";

        const renderReset = (message, email = "") => {
            return res.render("auth/reset-password", {
                title: "DeskApp | Reset Password",
                error: message,
                userId,
                email
            });
        };

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.redirect("/forgot-password");
        }

        const user = await User.findById(userId).select("_id email password");
        if (!user) {
            return res.redirect("/forgot-password");
        }

        if (!newPassword || !confirmPassword) {
            return renderReset("Please enter new password and confirm password.", user.email);
        }

        if (!isValidPassword(newPassword)) {
            return renderReset(passwordMessage, user.email);
        }

        if (newPassword !== confirmPassword) {
            return renderReset("New password and confirm password do not match.", user.email);
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        return res.redirect("/signin?success=Password reset successfully. Please login with your new password.");
    } catch (error) {
        console.error("DeskApp reset password error", error);
        return res.render("auth/reset-password", {
            title: "DeskApp | Reset Password",
            error: "Unable to reset password. Please try again.",
            userId: req.body.userId || "",
            email: ""
        });
    }
};

const logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        req.session.destroy((sessionErr) => {
            if (sessionErr) {
                return next(sessionErr);
            }

            res.clearCookie("connect.sid");
            return res.redirect("/signin");
        });
    });
};

const changePasswordPage = (req, res) => {
    res.render("auth/change-password", {
        title: "DeskApp | Change Password",
        error: null
    });
};

const changePassword = async (req, res, next) => {
    try {
        let { oldPassword, newPassword, confirmPassword } = req.body;

        oldPassword = oldPassword ? oldPassword.trim() : "";
        newPassword = newPassword ? newPassword.trim() : "";
        confirmPassword = confirmPassword ? confirmPassword.trim() : "";

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.render("auth/change-password", {
                title: "DeskApp | Change Password",
                error: "Please fill in all password fields."
            });
        }

        if (!isValidPassword(newPassword)) {
            return res.render("auth/change-password", {
                title: "DeskApp | Change Password",
                error: passwordMessage
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render("auth/change-password", {
                title: "DeskApp | Change Password",
                error: "New password and confirm password do not match."
            });
        }

        const loginUser = await User.findById(req.user._id).exec();
        if (!loginUser) {
            return res.redirect("/signin");
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, loginUser.password);
        if (!isOldPasswordValid) {
            return res.render("auth/change-password", {
                title: "DeskApp | Change Password",
                error: "Old password does not match your current password."
            });
        }

        loginUser.password = await bcrypt.hash(newPassword, 12);
        await loginUser.save();

        req.logout((logoutErr) => {
            if (logoutErr) {
                return next(logoutErr);
            }

            req.session.destroy((sessionErr) => {
                if (sessionErr) {
                    return next(sessionErr);
                }

                res.clearCookie("connect.sid");
                return res.redirect("/signin");
            });
        });
    } catch (error) {
        console.error("DeskApp change password error", error);
        return res.render("auth/change-password", {
            title: "DeskApp | Change Password",
            error: "Unable to change password. Please try again."
        });
    }
};

module.exports = {
    loginPage,
    registerPage,
    signUp,
    signIn,
    forgotPasswordPage,
    verifyForgotEmail,
    resetPasswordPage,
    resetPassword,
    logout,
    changePasswordPage,
    changePassword
};
