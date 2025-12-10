# Board Game Meetups — API (server)

Minimal Express + MongoDB API for the Board Game Meetups project.

Live sites
- Frontend: https://citstudent.lanecc.edu/~lewisj628/CS295R/board-game-meetups/index.html#/
- Backend API base URL: http://citweb.lanecc.edu:5028/api/

Quick start

Requirements
- Node.js (14+)
- npm
- MongoDB instance (URI)

Environment (.env)
MONGODB_URI=<your-mongodb-uri>
PORT=5028
FRONTEND_ORIGIN=https://citstudent.lanecc.edu   # optional
NODE_ENV=development

Install & run
1. Install dependencies:
   npm install
2. Create a .env file with MONGODB_URI (and other optional vars).
3. Start the server:
   node index.js
   # or with npm script if configured:
   npm start

API Endpoints
- GET /api/events — list events
- GET /api/events/slug/:slug — get event by slug
- POST /api/events — create event
  Body (JSON): { title, description, date, time, location, image, imageSmall, modalImage }
- PUT /api/events/:id — update event by id
- DELETE /api/events/:id — delete event by id

Notes
- Slugs are generated from the event title using slugify.
- When NODE_ENV=production the server will attempt to serve a frontend build from a sibling directory (adjust as needed).
- MONGODB_URI is required in production; the server will exit if it is not set.

License
Add a LICENSE file with your preferred license.