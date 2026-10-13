const express = require("express")
const { uploadSingleSong } = require("../middleware/upload.middleware")
const authUser = require("../middleware/auth.middleware")
const { adminOnly } = require("../middleware/admin.middleware")
const songController = require("../controller/song.controller")


const router = express.Router()

/**
 * POST /api/songs/  — admin only (see ADMIN_EMAILS in .env).
 * Auth and the admin check run BEFORE multer, so a stranger's upload is
 * rejected without the file ever being read into memory.
 */
router.post("/", authUser, adminOnly, uploadSingleSong, songController.uploadSong)

// Reading songs needs a logged-in user (the frontend already sends the cookie)
router.get('/list', authUser, songController.getSongList)

router.get('/', authUser, songController.getSong)

module.exports = router