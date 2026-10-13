const songModel = require("../models/song.model")
const storageService = require("../services/storage.service")
const id3 = require("node-id3")

const MOODS = [ "sad", "happy", "surprised" ]
const isProduction = process.env.NODE_ENV === 'production'

// The title comes from the mp3's own tags, so never trust it as a file name.
function safeFileName(title) {
    return String(title).replace(/[^\w\s().\-]/g, "_").trim().slice(0, 80) || "song"
}

async function uploadSong(req, res) {

    const { mood } = req.body || {}

    // Check everything cheap BEFORE spending an upload on it
    if (!MOODS.includes(mood)) {
        return res.status(400).json({ message: `mood must be one of: ${MOODS.join(", ")}` })
    }

    if (!req.file) {
        return res.status(400).json({ message: 'No file received. Send the mp3 in a form-data field named "song".' })
    }

    const songBuffer = req.file.buffer
    const tags = id3.read(songBuffer)

    if (!tags?.title || !tags?.image?.imageBuffer) {
        return res.status(422).json({ message: "This mp3 needs an ID3 title and an embedded cover image." })
    }

    const name = safeFileName(tags.title)
    const posterExt = tags.image.mime === "image/png" ? "png" : "jpeg"

    try {
        const [ songFile, posterFile ] = await Promise.all([
            storageService.uploadFile({
                buffer: songBuffer,
                filename: name + ".mp3",
                folder: "/cohort-2/moodify/songs"
            }),
            storageService.uploadFile({
                buffer: tags.image.imageBuffer,
                filename: name + "." + posterExt,
                folder: "/cohort-2/moodify/posters"
            })
        ])

        const song = await songModel.create({
            title: tags.title,
            url: songFile.url,
            posterUrl: posterFile.url,
            mood
        })

        return res.status(201).json({
            message: "song created successfully",
            song
        })
    } catch (err) {
        console.error("Song upload failed:", err)
        return res.status(500).json({
            message: "Could not upload the song. Check the server logs.",
            ...(isProduction ? {} : { detail: err.message })
        })
    }

}

function readMood(req, res) {
    const { mood } = req.query

    if (typeof mood !== "string" || !MOODS.includes(mood)) {
        res.status(400).json({ message: `mood must be one of: ${MOODS.join(", ")}` })
        return null
    }

    return mood
}

async function getSong(req, res) {

    const mood = readMood(req, res)
    if (!mood) return

    const song = await songModel.findOne({
        mood,
    })

    res.status(200).json({
        message: "song fetched successfully.",
        song,
    })

}

async function getSongList(req, res) {

    const mood = readMood(req, res)
    if (!mood) return

    const songs = await songModel.find({
        mood,
    }).limit(20)

    res.status(200).json({
        message: "songs fetched successfully.",
        songs,
    })

}


module.exports = { uploadSong, getSong, getSongList }