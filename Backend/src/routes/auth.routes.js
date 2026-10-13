const { Router } = require('express');
const router = Router();
const authController = require("../controller/auth.controller")
const authMiddleware = require("../middleware/auth.middleware")
const { validateRegister, validateLogin } = require("../middleware/validate.middleware")
const { loginLimiter, registerLimiter } = require("../middleware/rateLimit.middleware")

router.post('/register', registerLimiter, validateRegister, authController.registerUser)

router.post('/login', loginLimiter, validateLogin, authController.loginUser)

router.get('/get-me', authMiddleware, authController.getMe)

router.get('/logout', authController.logoutUser)

module.exports = router;