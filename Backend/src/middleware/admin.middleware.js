const userModel = require("../models/user.model")

// Who may upload songs: a comma-separated list in .env
//   ADMIN_EMAILS=you@example.com,friend@example.com
// If it is empty or missing, NOBODY is an admin (fails closed).
function adminEmails() {
    return (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
}

function isAdminEmail(email) {
    return Boolean(email) && adminEmails().includes(String(email).trim().toLowerCase())
}

// Use AFTER auth.middleware (needs req.user).
async function adminOnly(req, res, next) {
    const user = await userModel.findById(req.user.id)

    if (!user || !isAdminEmail(user.email)) {
        return res.status(403).json({ message: "Only an admin can do this" })
    }

    next()
}

module.exports = { adminOnly, isAdminEmail }