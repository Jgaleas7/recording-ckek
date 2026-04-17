import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import apiRouter from './router/api/index.js'
import 'dotenv/config'

const app = express()
const port = process.env.PORT || 4002

const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors(corsOptions))
app.use('/api', apiRouter)
app.listen(port, async () => {
  console.log(`Listening on port ${port}`)
})
