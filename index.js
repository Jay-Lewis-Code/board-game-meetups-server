import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import slugify from 'slugify'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
 
dotenv.config()
 
const app = express()

// Resolve path to the built frontend (dist folder placed next to this file)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.resolve(__dirname, './dist')

// Temp run the static dist server due to SSH not available on server
app.use(express.static("dist"));

// configure CORS: allow specific origin if provided, otherwise permissive in dev
const corsOptions = {}
if (process.env.FRONTEND_ORIGIN) {
  corsOptions.origin = process.env.FRONTEND_ORIGIN
} else {
  corsOptions.origin = true // allow all (use only in development)
}
app.use(cors(corsOptions))
app.use(express.json())

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    date: String,
    time: String,          
    location: String,
    image: String,         // large image
    imageSmall: String,    // small image for thumbs
    modalImage: String,    // temporary placeholder image for future google api
    slug: { type: String, unique: true, index: true },
  },
  { timestamps: true },
)

const Event = mongoose.model('Event', eventSchema)

// List
app.get('/api/events', async (_req, res) => {
  const events = await Event.find().sort({ createdAt: -1 })
  res.json(events)
})

// Get by slug
app.get('/api/events/slug/:slug', async (req, res) => {
  const event = await Event.findOne({ slug: req.params.slug })
  if (!event) return res.status(404).json({ message: 'Not found' })
  res.json(event)
})

// Create
app.post('/api/events', async (req, res) => {
  try {
    const { title, ...rest } = req.body
    const slug = slugify(title, { lower: true, strict: true })
    const event = await Event.create({ title, slug, ...rest })
    res.status(201).json(event)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Update by id
app.put('/api/events/:id', async (req, res) => {
  try {
    const { title, ...rest } = req.body
    const slug = title ? slugify(title, { lower: true, strict: true }) : undefined
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { ...rest, ...(slug ? { slug } : {}) },
      { new: true },
    )
    if (!event) return res.status(404).json({ message: 'Not found' })
    res.json(event)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Delete by id
app.delete('/api/events/:id', async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id)
  if (!event) return res.status(404).json({ message: 'Not found' })
  res.json({ success: true })
})

/* KEEP AND SWITCH BACK AFTER RETURNING TO FULL STACK
  // serve static frontend in production (assumes frontend build is at ../board-game-meetups/)
  if (process.env.NODE_ENV === 'production') {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const distPath = path.resolve(__dirname, '../board-game-meetups/')
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath))
      // use '/*' (not '*') to avoid path-to-regexp errors
      app.get('/*', (req, res) => {
        // keep /api routes handled by Express; fallback everything else to index.html
        if (req.path.startsWith('/api')) return res.status(404).end()
        res.sendFile(path.join(distPath, 'index.html'))
      })
    } else {
      console.warn(`dist not found at ${distPath} — skipping static file serving`)
    }
  }
*/


// serve static frontend (built dist) in all environments
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))

  // final catch‑all handler for non-API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distPath, 'index.html'))
  })
} else {
  console.warn(`dist not found at ${distPath} — skipping static file serving`)
}


// default fallback port
const PORT = process.env.PORT || 5028

// require MONGODB_URI in production
const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Set it in the server environment variables.')
  if (process.env.NODE_ENV === 'production') process.exit(1)
}

mongoose
  .connect(MONGODB_URI)
  .then(() => app.listen(PORT, () => console.log(`API running on :${PORT}`)))
  .catch((err) => {
    console.error('DB connection error', err)
    process.exit(1)
  })