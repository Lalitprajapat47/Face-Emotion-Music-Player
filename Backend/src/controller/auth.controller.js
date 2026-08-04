const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const blacklistModel = require("../models/blacklist.model")
const redis = require("../config/cache")


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
    const user = await userModel.create({
        username,
        email,
        password: hash
    })

    const token = jwt.sign(
        {
            id: user._id,
            username: user.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" })

    res.cookie("token", token)
    return res.status(201).json(
        {
            message: "User registered successfully",
            user
        }
    )
}

async function loginUser(req, res) {
    const { email, password, username } = req.body
    const user = await userModel.findOne({
        $or: [
            { email },
            { username }
        ]
    }).select("+password")

    if (!user) {
        return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
        {
            id: user._id,
            username: user.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token)
    return res.status(201).json(
        {
            message: "User logged in successfully",
            user
        }
    )
}

async function getMe(req, res) {
    const user = await userModel.findById(req.user.id)
    return res.status(200).json({ user })
}

async function logoutUser(req, res) {
    const token = req.cookies.token
    res.clearCookie("token")

    await redis.set(token, Date.now().toString())

    res.status(200).json(
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