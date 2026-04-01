# JobTrackr — Job Application Tracking System

Track your job applications, CVs, motivation letters, and interview status — all in one place.

## Features

- 📝 **Add Applications** — Store company name, job title, job description, and posting URL
- 📎 **Upload Documents** — Attach your CV and motivation letter (PDF, DOC, DOCX, TXT)
- 📊 **Dashboard** — Overview stats: total, pending, interviews, offers, rejected
- 🔍 **Search & Filter** — Quickly find applications by company, title, or status
- 🔄 **Status Tracking** — Update status: Applied → Interview → Offered / Rejected / Withdrawn
- 📅 **Interview Dates** — Track when your interviews are scheduled
- 📋 **Detail View** — Click any application to see full details and download documents

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (via sql.js)
- **Frontend:** Vanilla HTML/CSS/JS
- **File Uploads:** Multer

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy on Render

1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Deploy!
