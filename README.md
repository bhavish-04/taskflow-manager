# TaskFlow — Team Task Manager

A full-stack web application for creating projects, assigning tasks, and tracking progress with role-based access control (Admin/Member).

## 🚀 Features

- **Authentication** — Signup/Login with JWT tokens
- **Project Management** — Create, update, delete projects
- **Team Management** — Add/remove members with Admin/Member roles
- **Task Tracking** — Kanban board with To Do, In Progress, Done columns
- **Dashboard** — Stats overview, overdue tasks, personal task list
- **Role-Based Access** — Admins manage projects/members; Members create/update tasks

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Styling | Vanilla CSS (dark theme) |

## 📋 Prerequisites

- **Node.js** v18+ installed
- **MongoDB Atlas** account (free tier) — see setup below
- **Git** installed

---

## 🗄️ MongoDB Atlas Setup (Free)

1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) and click **Try Free**
2. Create an account and sign in
3. Click **Build a Database** → select **M0 (Free)** → choose a region close to you
4. Set a **Database User** (username + password) — save these!
5. Under **Network Access**, click **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
6. Go to **Database** → click **Connect** → **Connect your application**
7. Copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
8. Replace `<username>` and `<password>` with your database user credentials
9. Add a database name to the URL: `...mongodb.net/taskflow?retryWrites=true...`

---

## 🖥️ Local Development

### 1. Clone and install
```bash
git clone <your-repo-url>
cd "Ethera ai assessmentr"

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure environment
```bash
# In /server, create .env file
cd ../server
cp .env.example .env
```

Edit `server/.env`:
```env
MONGODB_URI=mongodb+srv://your-user:your-pass@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
JWT_SECRET=any-random-secret-string-here
PORT=5000
NODE_ENV=development
```

### 3. Run the app
Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies API calls to the backend on port 5000.

---

## 🌐 Railway Deployment

### 1. Create Railway Account
1. Go to [https://railway.app](https://railway.app) and sign up with GitHub
2. Verify your account

### 2. Prepare for deployment

Build the frontend first:
```bash
cd client
npm run build
```

The Express server serves the built frontend in production mode.

### 3. Deploy to Railway

**Option A: Via Railway Dashboard**
1. Push your code to a GitHub repository
2. In Railway, click **New Project** → **Deploy from GitHub Repo**
3. Select your repository
4. Set **Root Directory** to `server`
5. Add these **Environment Variables** in the Variables tab:
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = a strong random secret
   - `NODE_ENV` = `production`
   - `PORT` = `5000`

**Option B: Via Railway CLI**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### 4. Configure build
In Railway settings, set:
- **Build Command:** `cd ../client && npm install && npm run build && cd ../server && npm install`
- **Start Command:** `node server.js`
- **Root Directory:** `server`

Or create a root `package.json` (see below).

### Root package.json for Railway (optional)
Create `package.json` at the project root:
```json
{
  "name": "taskflow",
  "scripts": {
    "install:all": "cd server && npm install && cd ../client && npm install",
    "build": "cd client && npm run build",
    "start": "cd server && node server.js",
    "postinstall": "npm run install:all && npm run build"
  }
}
```
Then in Railway, just set `NODE_ENV=production`, `MONGODB_URI`, and `JWT_SECRET`.

---

## 📁 Project Structure

```
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Navbar, TaskModal, ProtectedRoute
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Dashboard, Projects, ProjectDetail, Login, Signup
│   │   ├── services/       # API client (axios)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css       # Design system
│   └── package.json
├── server/                 # Express backend
│   ├── config/             # Database connection
│   ├── controllers/        # Auth, Project, Task, Dashboard
│   ├── middleware/          # JWT auth, RBAC
│   ├── models/             # User, Project, Task (Mongoose)
│   ├── routes/             # API route definitions
│   ├── server.js           # Entry point
│   └── package.json
├── .gitignore
└── README.md
```

## 🔐 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/projects` | Yes | List projects |
| POST | `/api/projects` | Yes | Create project |
| GET | `/api/projects/:id` | Yes | Get project |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add member |
| DELETE | `/api/projects/:id/members/:uid` | Admin | Remove member |
| POST | `/api/tasks` | Member+ | Create task |
| GET | `/api/tasks/project/:pid` | Member+ | List project tasks |
| PUT | `/api/tasks/:id` | Member+ | Update task |
| DELETE | `/api/tasks/:id` | Admin | Delete task |
| PATCH | `/api/tasks/:id/status` | Member+ | Update status |
| GET | `/api/dashboard/stats` | Yes | Dashboard data |
