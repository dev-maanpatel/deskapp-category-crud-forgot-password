const requireAuth = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    return res.redirect("/signin");
};

const redirectIfLoggedIn = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }

    return next();
};

module.exports = { requireAuth, redirectIfLoggedIn };
