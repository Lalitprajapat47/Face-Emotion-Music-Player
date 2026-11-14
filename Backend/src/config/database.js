const mongoose = require('mongoose')

// One connection attempt is shared by everyone who asks (on Vercel several
// requests can arrive while the first connection is still being made), an open
// connection is reused, and a failed attempt is forgotten so the next call
// tries again instead of failing forever.
let connecting = null

function connectToDb(){
    if (mongoose.connection.readyState === 1) {
        return Promise.resolve(mongoose)
    }

    if (!connecting) {
        connecting = mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
            .then((m) => {
                console.log("connected to DB")
                return m
            })
            .catch((err) => {
                connecting = null
                throw err
            })
    }

    return connecting
}

module.exports = connectToDb