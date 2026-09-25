const ImageKit = require("@imagekit/nodejs").default

const UPLOAD_TIMEOUT = parseInt(process.env.IMAGEKIT_UPLOAD_TIMEOUT || "120000", 10)

const client = new ImageKit({
    publicKey:   process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey:  process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    timeout:     UPLOAD_TIMEOUT
})

async function uploadFile({ buffer, filename, folder = "" }) {
    const file = await client.files.upload({
        file:     Buffer.from(buffer),
        fileName: filename,
        folder
    })
    return file
}

module.exports = { uploadFile }