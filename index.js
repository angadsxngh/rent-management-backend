import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import ownerRouter from './routes/owner routes/owner.routes.js'

const app = express()

app.use(cors({
    origin: "*",
    credentials: true,
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: '16kb'}))
app.use(express.static('public'))
app.use(cookieParser())
app.use(bodyParser.json())

const PORT = process.env.PORT || 3000;

app.listen(3000, () => {
    console.log("Server running on port ", PORT)
})

app.use('/api/v1/owners', ownerRouter)