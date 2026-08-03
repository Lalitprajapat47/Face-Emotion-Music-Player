const app = require('./src/app')
const connectToDb = require('./config/database')

connectToDb()

app.listen(3000, () => {
    console.log("Server runnig 3000 port")
})