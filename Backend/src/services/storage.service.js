const ImageKit = require("@imagekit/nodejs").default

const UPLOAD_TIMEOUT = parseInt(process.env.IMAGEKIT_UPLOAD_TIMEOUT || "120000", 10)

const client = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    // Only pass these if they're actually set in .env — passing `undefined`
    // explicitly can behave differently from simply omitting the key,
    // depending on the SDK's internal validation.
    ...(process.env.IMAGEKIT_PUBLIC_KEY ? { publicKey: process.env.IMAGEKIT_PUBLIC_KEY } : {}),
    ...(process.env.IMAGEKIT_URL_ENDPOINT ? { urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT } : {}),
    timeout: UPLOAD_TIMEOUT,
    maxRetries: 2
})

async function uploadFile({ buffer, filename, folder = "" }) {

    // ImageKit.toFile() is the SDK's own helper for turning a raw Buffer
    // into the shape its upload endpoint expects — this was in the
    // original working version and shouldn't be swapped for a plain
    // Buffer, or the upload can fail/behave unexpectedly.
    const file = await client.files.upload({
        file: await ImageKit.toFile(Buffer.from(buffer)),
        fileName: filename,
        folder
    })

    return file

}

module.exports = { uploadFile }