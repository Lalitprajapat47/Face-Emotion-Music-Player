const { Router } = require('express');
const router = Router();
const authController = require("../controller/auth.controller")
const authMiddleware = require("../middleware/auth.middleware")

router.post('/register', authController.registerUser)

router.post('/login', authController.loginUser)

router.get('/get-me', authMiddleware, authController.getMe)

router.get('/logout', authController.logoutUser)

module.exports = router;