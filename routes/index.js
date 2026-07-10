const express = require("express");
const router = express.Router();
const upload = require("../middleware/multer");
const { requireAuth, redirectIfLoggedIn } = require("../middleware/auth");
const {
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
} = require("../controllers/authController");
const { dashboardPage, profilepage, updateProfile } = require("../controllers/pageController");
const { viewCategories, addCategoryPage, createCategory, editCategoryPage, updateCategory, deleteCategory } = require("../controllers/categoryController");

router.get("/", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }
    return res.redirect("/signin");
});


router.get("/signin", redirectIfLoggedIn, loginPage);
router.post("/signin", signIn);
router.get("/signup", redirectIfLoggedIn, registerPage);
router.post("/signup", signUp);
router.get("/forgot-password", redirectIfLoggedIn, forgotPasswordPage);
router.post("/forgot-password", redirectIfLoggedIn, verifyForgotEmail);
router.post("/verify-otp", redirectIfLoggedIn, verifyOtp);
router.post("/resend-otp", redirectIfLoggedIn, resendOtp);
router.get("/reset-password/:identity", redirectIfLoggedIn, resetPasswordPage);
router.post("/reset-password", redirectIfLoggedIn, resetPassword);
router.get("/logout", requireAuth, logout);
router.get("/change-password", requireAuth, changePasswordPage);
router.post("/change-password", requireAuth, changePassword);

router.get("/dashboard", requireAuth, dashboardPage);
router.get("/profile", requireAuth, profilepage);
router.post("/profile", requireAuth, upload.single("profileImage"), updateProfile);

router.get("/categories", requireAuth, viewCategories);
router.get("/categories/add", requireAuth, addCategoryPage);
router.post("/categories/add", requireAuth, createCategory);
router.get("/categories/edit/:id", requireAuth, editCategoryPage);
router.post("/categories/edit/:id", requireAuth, updateCategory);
router.post("/categories/delete/:id", requireAuth, deleteCategory);


module.exports = router;
