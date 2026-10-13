const multer = require("multer")

const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3"]

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 10, // 10MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            return cb(null, true)
        }
        cb(new Error("Only .mp3 files are allowed"))
    }
})

// Wraps multer so a bad upload answers with clean JSON (413 / 400) instead of
// falling through to Express's default HTML error page.
function uploadSingleSong(req, res, next) {
    upload.single("song")(req, res, (err) => {
        if (!err) return next()

        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ message: "File too large (max 10MB)" })
        }
        return res.status(400).json({ message: err.message || "Upload failed" })
    })
}

module.exports = { upload, uploadSingleSong }