const User = require("../models/userModel");
const fs = require("fs");
const path = require("path");

const dashboardPage = (req, res) => {
    res.render("dashboard/dashboard", { title: "DeskApp | Dashboard" });
};

const profilepage = (req, res) => {
    res.render("profile/profile", {
        title: "DeskApp | Profile",
        user: req.user,
        success: req.query.success || null,
        error: null
    });
};

const updateProfile = async (req, res) => {
    try {
        const {
            name,
            dob,
            gender,
            country,
            state,
            phone,
            address,
            facebook,
            twitter,
            linkedin,
            instagram,
            github
        } = req.body;

        const profileData = {
            name: name ? name.trim() : req.user.name,
            dob: dob ? dob.trim() : "",
            gender: gender ? gender.trim() : "",
            country: country ? country.trim() : "",
            state: state ? state.trim() : "",
            phone: phone ? phone.trim() : "",
            address: address ? address.trim() : "",
            social: {
                facebook: facebook ? facebook.trim() : "",
                twitter: twitter ? twitter.trim() : "",
                linkedin: linkedin ? linkedin.trim() : "",
                instagram: instagram ? instagram.trim() : "",
                github: github ? github.trim() : ""
            }
        };

        if (req.file) {
            if (req.user.profileImage) {
                const oldImagePath = path.join(__dirname, "..", "public", req.user.profileImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            profileData.profileImage = "uploads/" + req.file.filename;
        }

        await User.findByIdAndUpdate(req.user._id, profileData, { new: true });
        return res.redirect("/profile?success=Profile%20updated%20successfully");
    } catch (error) {
        console.error("Profile update error", error);
        return res.render("profile/profile", {
            title: "DeskApp | Profile",
            user: req.user,
            success: null,
            error: "Unable to update profile. Please try again."
        });
    }
};

module.exports = { dashboardPage, profilepage, updateProfile };
