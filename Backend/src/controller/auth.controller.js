const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")



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
    })

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

module.exports = {
    registerUser,
    loginUser,
    getMe
}