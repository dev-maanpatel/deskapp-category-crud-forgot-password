const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const passport = require("../middleware/passport");
const mongoose = require("mongoose");
const otpGenerator = require("otp-generator");
const { randomUUID } = require("crypto");

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

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_WAIT_MS = 30 * 1000;

const createOtp = () => {
    return otpGenerator.generate(6, {
        digits: true,
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    });
};

const renderForgotPassword = (res, values = {}) => {
    return res.render("auth/forgot-password", {
        title: "DeskApp | Forgot Password",
        error: values.error || null,
        success: values.success || null,
        email: values.email || "",
        showOtpModal: Boolean(values.showOtpModal),
        otpIdentity: values.otpIdentity || "",
        otpExpiresAt: values.otpExpiresAt || null,
        otpResendAt: values.otpResendAt || null
    });
};

const forgotPasswordPage = (req, res) => {
    return renderForgotPassword(res);
};

const verifyForgotEmail = async (req, res) => {
    try {
        let { email } = req.body;
        email = email ? email.toLowerCase().trim() : "";

        if (!email) {
            return renderForgotPassword(res, {
                error: "Please enter your registered email address.",
                email
            });
        }

        if (!isValidEmail(email)) {
            return renderForgotPassword(res, {
                error: "Please enter a valid email address.",
                email
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return renderForgotPassword(res, {
                error: "This email is not registered. Please enter your registered email.",
                email
            });
        }

        const otp = createOtp();
        const otpIdentity = randomUUID();
        const currentTime = Date.now();
        const otpExpiresAt = new Date(currentTime + OTP_EXPIRY_MS);
        const otpResendAt = new Date(currentTime + OTP_RESEND_WAIT_MS);

        user.resetOtp = String(otp);
        user.resetOtpIdentity = String(otpIdentity);
        user.resetOtpExpiresAt = otpExpiresAt;
        user.resetOtpResendAt = otpResendAt;
        user.resetOtpVerified = false;
        await user.save();

        console.log("========================================");
        console.log(`Forgot password OTP for ${user.email}: ${otp}`);
        console.log("========================================");

        return renderForgotPassword(res, {
            success: "OTP generated successfully. Check the server console.",
            email: user.email,
            showOtpModal: true,
            otpIdentity,
            otpExpiresAt: otpExpiresAt.getTime(),
            otpResendAt: otpResendAt.getTime()
        });
    } catch (error) {
        console.error("DeskApp forgot password email check error", error);
        return renderForgotPassword(res, {
            error: "Unable to generate OTP. Please try again.",
            email: req.body.email || ""
        });
    }
};

const verifyOtp = async (req, res) => {
    try {
        let { otp, otpIdentity } = req.body;
        otp = otp ? String(otp).trim() : "";
        otpIdentity = otpIdentity ? String(otpIdentity).trim() : "";

        const user = await User.findOne({ resetOtpIdentity: otpIdentity }).select(
            "_id email resetOtp resetOtpExpiresAt resetOtpResendAt resetOtpIdentity resetOtpVerified"
        );

        if (!user) {
            return renderForgotPassword(res, {
                error: "Invalid OTP request. Please generate a new OTP."
            });
        }

        const modalData = {
            email: user.email,
            showOtpModal: true,
            otpIdentity: user.resetOtpIdentity,
            otpExpiresAt: user.resetOtpExpiresAt ? user.resetOtpExpiresAt.getTime() : Date.now(),
            otpResendAt: user.resetOtpResendAt ? user.resetOtpResendAt.getTime() : Date.now()
        };

        if (!otp || !/^\d{6}$/.test(otp)) {
            return renderForgotPassword(res, {
                ...modalData,
                error: "Please enter a valid 6-digit OTP."
            });
        }

        if (!user.resetOtpExpiresAt || Date.now() > user.resetOtpExpiresAt.getTime()) {
            return renderForgotPassword(res, {
                ...modalData,
                error: "OTP has expired. Please resend OTP."
            });
        }

        if (String(user.resetOtp) !== otp) {
            return renderForgotPassword(res, {
                ...modalData,
                error: "Incorrect OTP. Please try again."
            });
        }

        user.resetOtpVerified = true;
        user.resetOtp = "";
        user.resetOtpExpiresAt = null;
        user.resetOtpResendAt = null;
        await user.save();

        return res.redirect(`/reset-password/${encodeURIComponent(user.resetOtpIdentity)}`);
    } catch (error) {
        console.error("DeskApp OTP verification error", error);
        return renderForgotPassword(res, {
            error: "Unable to verify OTP. Please try again."
        });
    }
};

const resendOtp = async (req, res) => {
    try {
        const otpIdentity = req.body.otpIdentity ? String(req.body.otpIdentity).trim() : "";
        const user = await User.findOne({ resetOtpIdentity: otpIdentity });

        if (!user) {
            return renderForgotPassword(res, {
                error: "OTP session not found. Please enter your email again."
            });
        }

        if (user.resetOtpResendAt && Date.now() < user.resetOtpResendAt.getTime()) {
            return renderForgotPassword(res, {
                error: "Please wait until the 30-second timer finishes before resending OTP.",
                email: user.email,
                showOtpModal: true,
                otpIdentity: user.resetOtpIdentity,
                otpExpiresAt: user.resetOtpExpiresAt ? user.resetOtpExpiresAt.getTime() : null,
                otpResendAt: user.resetOtpResendAt.getTime()
            });
        }

        const otp = createOtp();
        const newIdentity = randomUUID();
        const currentTime = Date.now();
        const otpExpiresAt = new Date(currentTime + OTP_EXPIRY_MS);
        const otpResendAt = new Date(currentTime + OTP_RESEND_WAIT_MS);

        user.resetOtp = String(otp);
        user.resetOtpIdentity = String(newIdentity);
        user.resetOtpExpiresAt = otpExpiresAt;
        user.resetOtpResendAt = otpResendAt;
        user.resetOtpVerified = false;
        await user.save();

        console.log("========================================");
        console.log(`Resent forgot password OTP for ${user.email}: ${otp}`);
        console.log("========================================");

        return renderForgotPassword(res, {
            success: "New OTP generated successfully. Check the server console.",
            email: user.email,
            showOtpModal: true,
            otpIdentity: newIdentity,
            otpExpiresAt: otpExpiresAt.getTime(),
            otpResendAt: otpResendAt.getTime()
        });
    } catch (error) {
        console.error("DeskApp resend OTP error", error);
        return renderForgotPassword(res, {
            error: "Unable to resend OTP. Please try again."
        });
    }
};

const resetPasswordPage = async (req, res) => {
    try {
        const resetIdentity = req.params.identity ? String(req.params.identity).trim() : "";
        const user = await User.findOne({
            resetOtpIdentity: resetIdentity,
            resetOtpVerified: true
        }).select("_id email resetOtpIdentity resetOtpVerified");

        if (!user) {
            return res.redirect("/forgot-password");
        }

        return res.render("auth/reset-password", {
            title: "DeskApp | Reset Password",
            error: null,
            resetIdentity: user.resetOtpIdentity,
            email: user.email
        });
    } catch (error) {
        console.error("DeskApp reset password page error", error);
        return res.redirect("/forgot-password");
    }
};

const resetPassword = async (req, res) => {
    try {
        let { resetIdentity, newPassword, confirmPassword } = req.body;

        resetIdentity = resetIdentity ? String(resetIdentity).trim() : "";
        newPassword = newPassword ? newPassword.trim() : "";
        confirmPassword = confirmPassword ? confirmPassword.trim() : "";

        const user = await User.findOne({
            resetOtpIdentity: resetIdentity,
            resetOtpVerified: true
        }).select("_id email password resetOtp resetOtpExpiresAt resetOtpResendAt resetOtpIdentity resetOtpVerified");

        if (!user) {
            return res.redirect("/forgot-password");
        }

        const renderReset = (message) => {
            return res.render("auth/reset-password", {
                title: "DeskApp | Reset Password",
                error: message,
                resetIdentity,
                email: user.email
            });
        };

        if (!newPassword || !confirmPassword) {
            return renderReset("Please enter new password and confirm password.");
        }

        if (!isValidPassword(newPassword)) {
            return renderReset(passwordMessage);
        }

        if (newPassword !== confirmPassword) {
            return renderReset("New password and confirm password do not match.");
        }

        user.password = await bcrypt.hash(newPassword, 12);
        user.resetOtp = "";
        user.resetOtpExpiresAt = null;
        user.resetOtpResendAt = null;
        user.resetOtpIdentity = null;
        user.resetOtpVerified = false;
        await user.save();

        return res.redirect("/signin?success=Password reset successfully. Please login with your new password.");
    } catch (error) {
        console.error("DeskApp reset password error", error);
        return res.redirect("/forgot-password");
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
    verifyOtp,
    resendOtp,
    resetPasswordPage,
    resetPassword,
    logout,
    changePasswordPage,
    changePassword
};
