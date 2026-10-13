const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const redis = require("../config/cache")
const { isAdminEmail } = require("../middleware/admin.middleware")

const isProduction = process.env.NODE_ENV === 'production'
const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
}

const TOKEN_TTL_SECONDS = 24 * 60 * 60   // must match expiresIn below ("1d")

// Compared against when the user doesn't exist, so "unknown user" and "wrong
// password" take about the same time (stops account probing by timing).
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10)

// Only what the frontend needs. NEVER send the whole document: on register it
// still contains the password hash, and on login it was explicitly selected.
function publicUser(user) {
    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: isAdminEmail(user.email),
    }
}

function issueToken(res, user) {
    const token = jwt.sign(
        {
            id: user._id,
            username: user.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_TTL_SECONDS }
    )

    res.cookie("token", token, cookieOptions)
}

async function registerUser(req, res) {
    const { username, email, password } = req.body

    const isAlreadyRegistered = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (isAlreadyRegistered) {
        return res.status(400).json({ message: "User already registered" })
    }

    const hash = await bcrypt.hash(password, 10)

    let user
    try {
        user = await userModel.create({
            username,
            email,
            password: hash
        })
    } catch (err) {
        // two sign-ups racing past the check above: the unique index catches it
        if (err?.code === 11000) {
            return res.status(400).json({ message: "User already registered" })
        }
        throw err
    }

    issueToken(res, user)

    return res.status(201).json(
        {
            message: "User registered successfully",
            user: publicUser(user)
        }
    )
}

async function loginUser(req, res) {
    const { email, password, username } = req.body

    const identifiers = []
    if (email) identifiers.push({ email })
    if (username) identifiers.push({ username })

    const user = await userModel.findOne({ $or: identifiers }).select("+password")

    if (!user) {
        await bcrypt.compare(password, DUMMY_HASH)
        return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" })
    }

    issueToken(res, user)

    return res.status(201).json(
        {
            message: "User logged in successfully",
            user: publicUser(user)
        }
    )
}

async function getMe(req, res) {
    const user = await userModel.findById(req.user.id)

    if (!user) {
        return res.status(401).json({ message: "User no longer exists" })
    }

    return res.status(200).json({ user: publicUser(user) })
}

async function logoutUser(req, res) {
    const token = req.cookies?.token
    res.clearCookie("token", cookieOptions)

    if (token) {
        try {
            // Only a genuine, unexpired token is worth blacklisting (otherwise
            // anyone could fill Redis with junk keys), and it has to stay
            // blacklisted for as long as it would have stayed valid — the old
            // fixed 1 hour let a logged-out token work again after an hour.
            const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] })
            const secondsLeft = decoded.exp - Math.floor(Date.now() / 1000)

            if (secondsLeft > 0) {
                await redis.set(token, "1", "EX", secondsLeft)
            }
        } catch (err) {
            // invalid or expired token: nothing to blacklist, cookie is cleared anyway
        }
    }

    return res.status(200).json(
        {
            message: "User logged out successfully"
        }
    )
}

module.exports = {
    registerUser,
    loginUser,
    getMe,
    logoutUser
}