# 📋 JobTrackr — Job Application Tracking System

> Track your job applications, CVs, motivation letters, and interview status — all in one place.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/shashiprakash610/job-application-tracker)

## 🌐 Live Demo

🔗 **[https://job-application-tracker.onrender.com](https://job-application-tracker.onrender.com)**

Access the tool from any device — desktop, tablet, or mobile.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Add Applications** | Store company name, job title, job description, and posting URL |
| 📎 **Upload Documents** | Attach your CV and motivation letter (PDF, DOC, DOCX, TXT — max 10MB) |
| 📊 **Dashboard** | Overview stats: total applications, pending, interviews, offers, rejected |
| 🔍 **Search & Filter** | Quickly find applications by company, title, or status |
| 🔄 **Status Tracking** | Update status: Applied → Interview → Offered / Rejected / Withdrawn |
| 📅 **Interview Dates** | Track when your interviews are scheduled |
| 📋 **Detail View** | Click any application to see full details and download uploaded documents |
| 🗑️ **Delete** | Remove applications and associated uploaded files |

## 🖼️ Screenshots

### Dashboard
![Dashboard](https://raw.githubusercontent.com/shashiprakash610/job-application-tracker/main/screenshots/dashboard.png)

### New Application Form
![New Application](https://raw.githubusercontent.com/shashiprakash610/job-application-tracker/main/screenshots/new-application.png)

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Database:** SQLite (via sql.js — pure JavaScript, no native dependencies)
- **Frontend:** Vanilla HTML / CSS / JavaScript
- **File Uploads:** Multer
- **Hosting:** Render (free tier)

## 🚀 Run Locally

```bash
# Clone the repository
git clone https://github.com/shashiprakash610/job-application-tracker.git
cd job-application-tracker

# Install dependencies
npm install

# Start the server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ☁️ Deploy on Render (Free)

1. Click the **Deploy to Render** button above, or:
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo: `shashiprakash610/job-application-tracker`
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Click **Deploy** — your app will be live in ~2 minutes!

## 📁 Project Structure

```
job-application-tracker/
├── server.js          # Express backend + API routes + SQLite database
├── render.yaml        # Render deployment blueprint
├── package.json
├── public/
│   ├── index.html     # Main HTML structure
│   ├── styles.css     # Premium dark theme UI
│   └── app.js         # Frontend logic & API calls
├── uploads/           # Uploaded CVs & motivation letters (auto-created)
└── applications.db    # SQLite database (auto-created)
```

## 📄 License

MIT — feel free to use and modify.

---

Made with ❤️ by [Shashi Prakash](https://github.com/shashiprakash610)
