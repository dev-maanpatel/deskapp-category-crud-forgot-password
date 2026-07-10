const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        resetOtp: {
            type: String,
            default: ""
        },
        resetOtpExpiresAt: {
            type: Date,
            default: null
        },
        resetOtpResendAt: {
            type: Date,
            default: null
        },
        resetOtpIdentity: {
            type: String,
            default: null,
            unique: true,
            sparse: true,
            index: true
        },
        resetOtpVerified: {
            type: Boolean,
            default: false
        },
        profileImage: {
            type: String,
            trim: true,
            default: ""
        },
        dob: {
            type: String,
            trim: true,
            default: ""
        },
        gender: {
            type: String,
            trim: true,
            default: ""
        },
        country: {
            type: String,
            trim: true,
            default: ""
        },
        state: {
            type: String,
            trim: true,
            default: ""
        },
        phone: {
            type: String,
            trim: true,
            default: ""
        },
        address: {
            type: String,
            trim: true,
            default: ""
        },
        social: {
            facebook: { type: String, trim: true, default: "" },
            twitter: { type: String, trim: true, default: "" },
            linkedin: { type: String, trim: true, default: "" },
            instagram: { type: String, trim: true, default: "" },
            github: { type: String, trim: true, default: "" }
        }
    }
);

module.exports = mongoose.model("User", userSchema);
