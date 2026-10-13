const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    posterUrl: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true
    },
    mood: {
        type: String,
        required: [true, "Mood is required"],
        enum: {
            values: [ "sad", "happy", "surprised" ],
            message: "Mood must be sad, happy or surprised"
        }
    }
})

const songModel = mongoose.model("songs", songSchema)

module.exports = songModel