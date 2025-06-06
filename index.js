import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import ownerRouter from './routes/owner routes/owner.routes.js'
import tenantRouter from './routes/tenant routes/tenant.routes.js'
import { startCron } from './services/cron.services.js'

const app = express()
startCron()

app.use(cors({
    origin: ["http://localhost:5173", "https://go-rentease.vercel.app"],
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
app.use('/api/v1/tenants', tenantRouter)