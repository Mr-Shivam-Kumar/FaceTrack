# 🎯 FaceTrack — Smart Attendance Management System

<div align="center">

**An intelligent, AI-powered attendance system using facial recognition technology**

*Runs 100% offline on localhost — No cloud services, paid APIs, or internet required*

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [Demo Accounts](#-demo-accounts)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Face Recognition](#-face-recognition)
- [Screenshots](#-screenshots)

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Faculty, Student)
- Secure password hashing with bcrypt
- Protected API routes

### 👤 Face Recognition
- Real-time webcam face detection using face-api.js
- Multiple face sample registration
- Automatic attendance marking
- Confidence score display
- Anti-spoofing with blink detection
- Support for multiple simultaneous face detection

### 📊 Modern Dashboard
- Premium SaaS-level UI design
- 8 KPI metric cards with animated counters
- Interactive charts (Line, Area, Bar, Pie, Heatmap)
- AI-powered insights panel
- Dark/Light mode toggle
- Glassmorphism design elements
- Framer Motion animations

### 📝 Attendance Management
- Real-time attendance session management
- Department/Semester/Subject based filtering
- Attendance calendar view (GitHub-style heatmap)
- Subject-wise attendance breakdown
- Bulk attendance operations

### 📈 Reports & Analytics
- PDF report generation
- Excel export
- CSV export
- Daily/Weekly/Monthly/Semester reports
- Department-wise analytics
- Student-wise reports

### 🔔 Notifications
- Low attendance alerts
- Session notifications
- Real-time updates via Socket.io
- Notification drawer

### 🎨 UI/UX
- Premium SaaS-level design
- Dark & Light mode
- Glassmorphism effects
- Smooth animations (Framer Motion)
- Responsive design
- Loading skeletons
- Empty states
- Professional typography (Inter font)

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS 3, Framer Motion, Recharts |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (local instance) |
| **Face Recognition** | @vladmandic/face-api (TensorFlow.js) |
| **Real-time** | Socket.io |
| **Authentication** | JWT, bcryptjs |
| **Reports** | PDFMake (PDF), ExcelJS (Excel) |
| **File Storage** | Local filesystem |

---

## 📦 Prerequisites

Before running this project, make sure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/

2. **MongoDB** (v6 or higher)
   - Download: https://www.mongodb.com/try/download/community
   - Make sure MongoDB is running on `localhost:27017`

3. **Git** (optional)
   - Download: https://git-scm.com/

### Verify Installation

```bash
node --version    # Should be v18+
npm --version     # Should be v9+
mongod --version  # Should be v6+
```

---

## 🚀 Installation

### Step 1: Clone/Download the Project

```bash
cd face-recognition-attendance-system
```

### Step 2: Install Dependencies

```bash
# Install all dependencies (root + server + client)
npm run setup
```

Or install individually:

```bash
# Root dependencies
npm install

# Server dependencies
cd server && npm install && cd ..

# Client dependencies
cd client && npm install && cd ..
```

### Step 3: Download Face Recognition Models

The face-api.js model files should be placed in `client/public/models/`. 

```bash
# Copy from node_modules (after client npm install)
cp -r client/node_modules/@vladmandic/face-api/model/* client/public/models/
```

On Windows PowerShell:
```powershell
Copy-Item -Path "client\node_modules\@vladmandic\face-api\model\*" -Destination "client\public\models\" -Recurse
```

### Step 4: Seed the Database

Make sure MongoDB is running, then:

```bash
npm run seed
```

This creates:
- 1 Admin account
- 10 Faculty accounts
- 100 Student accounts
- 5 Departments
- 20 Subjects
- 90 days of attendance records
- Sample notifications

---

## ▶️ Running the Application

### Start Both Server and Client

```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:5173

### Start Individually

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

---

## 🌐 Online Deployment & Cloud Configuration

FaceTrack can be deployed online in a cloud environment (e.g., Render, Fly.io, Heroku, AWS) with a cloud database (MongoDB Atlas) and static client hosting (Vercel, Netlify).

### 1. Database Setup (MongoDB Atlas)
1. Create a database cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Obtain your MongoDB connection string.
3. Configure the `MONGO_URI` environment variable on your server hosting provider:
   `mongodb+srv://<username>:<password>@cluster.mongodb.net/attendance_system`

### 2. CORS Security Whitelisting
For online deployments, restrict API access to your client domains by setting the `CLIENT_URL` environment variable:
- **CLIENT_URL**: A comma-separated list of allowed production origins.
  - Example: `CLIENT_URL=https://my-attendance-portal.vercel.app`
  - When `NODE_ENV=production` is set, CORS will actively reject any requests originating outside this whitelist.

### 3. Client API and Socket.io endpoints
When building the client application, configure Vite to target your hosted API endpoint by specifying the following environment variables during build time:
- **VITE_API_BASE_URL**: `https://your-backend-server.com/api`
- **VITE_SOCKET_URL**: `https://your-backend-server.com`

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@local.com | admin123 |
| **Faculty** | faculty@local.com | faculty123 |
| **Student** | student@local.com | student123 |

---

## 📁 Project Structure

```
face-recognition-attendance-system/
├── client/                          # React Frontend
│   ├── public/
│   │   └── models/                  # face-api.js model weights
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # Sidebar, Header, MainLayout
│   │   │   ├── ui/                  # Reusable UI components
│   │   │   ├── charts/              # Chart components
│   │   │   ├── face/                # Face recognition components
│   │   │   ├── attendance/          # Attendance components
│   │   │   └── notifications/       # Notification components
│   │   ├── pages/
│   │   │   ├── auth/                # Login page
│   │   │   ├── admin/               # Admin pages
│   │   │   ├── faculty/             # Faculty pages
│   │   │   └── student/             # Student pages
│   │   ├── contexts/                # React contexts
│   │   ├── hooks/                   # Custom hooks
│   │   ├── services/                # API service layer
│   │   └── utils/                   # Utility functions
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
├── server/                          # Express.js Backend
│   ├── config/                      # Database config
│   ├── models/                      # Mongoose models (12)
│   ├── controllers/                 # Route controllers
│   ├── routes/                      # API routes
│   ├── middleware/                   # Auth, RBAC, upload, etc.
│   ├── sockets/                     # Socket.io handlers
│   ├── scripts/                     # Database seeder
│   ├── index.js                     # Server entry point
│   └── package.json
├── uploads/                         # Uploaded photos
│   └── faces/                       # Student face photos
├── reports/                         # Generated reports
├── .env                             # Environment variables
├── .gitignore
├── package.json                     # Root package.json
└── README.md
```

---

## 📡 API Documentation

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Students
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/students` | List all students | Admin/Faculty |
| GET | `/api/students/:id` | Get student details | Admin/Faculty |
| POST | `/api/students` | Create student | Admin |
| PUT | `/api/students/:id` | Update student | Admin |
| DELETE | `/api/students/:id` | Delete student | Admin |
| GET | `/api/students/:id/attendance` | Student attendance | All |
| GET | `/api/students/:id/stats` | Student statistics | All |

### Faculty
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/faculty` | List all faculty | Admin |
| POST | `/api/faculty` | Create faculty | Admin |
| PUT | `/api/faculty/:id` | Update faculty | Admin |
| DELETE | `/api/faculty/:id` | Delete faculty | Admin |

### Attendance
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/attendance/mark` | Mark attendance | Faculty |
| POST | `/api/attendance/bulk` | Bulk mark | Faculty |
| GET | `/api/attendance/session/:id` | Session records | Faculty |
| GET | `/api/attendance/stats` | Statistics | Admin/Faculty |

### Sessions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/sessions/start` | Start session | Faculty |
| PUT | `/api/sessions/:id/end` | End session | Faculty |
| GET | `/api/sessions/active` | Active sessions | Admin/Faculty |

### Face Recognition
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/face/register/:studentId` | Register face | Admin/Faculty |
| GET | `/api/face/:studentId` | Get face data | Admin/Faculty |
| GET | `/api/face/class/:deptId/:semester` | Class face data | Faculty |
| DELETE | `/api/face/:studentId` | Delete face data | Admin |

### Dashboard
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/admin` | Admin KPIs | Admin |
| GET | `/api/dashboard/faculty` | Faculty KPIs | Faculty |
| GET | `/api/dashboard/daily-trend` | Daily trend | Admin |
| GET | `/api/dashboard/monthly-trend` | Monthly trend | Admin |
| GET | `/api/dashboard/department-stats` | Dept stats | Admin |
| GET | `/api/dashboard/heatmap` | Heatmap data | Admin |
| GET | `/api/dashboard/insights` | AI insights | Admin |

### Reports
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reports/pdf` | Generate PDF | Admin/Faculty |
| GET | `/api/reports/excel` | Generate Excel | Admin/Faculty |
| GET | `/api/reports/csv` | Generate CSV | Admin/Faculty |

---

## 🎭 Face Recognition

### How It Works

1. **Registration**: Students capture 3-5 face samples via webcam. Each sample generates a 128-dimension face descriptor (numerical fingerprint).

2. **Storage**: Descriptors are stored in MongoDB as arrays of numbers.

3. **Recognition**: During attendance sessions, the webcam detects faces in real-time. Each detected face's descriptor is compared against registered students using Euclidean distance.

4. **Matching**: If the distance is below the threshold (0.6), the student is identified and marked present automatically.

### Anti-Spoofing
- **Blink Detection**: Uses Eye Aspect Ratio (EAR) from facial landmarks
- **Liveness Check**: Requires natural head movements during registration
- **Photo Attack Prevention**: Sequential frame analysis

### Models Used
| Model | Purpose | Size |
|-------|---------|------|
| SSD MobileNet v1 | Face Detection | ~5.4 MB |
| 68-Point Face Landmark | Facial Landmarks | ~350 KB |
| Face Recognition | 128-d Descriptors | ~6.2 MB |
| Face Expression | Expression Detection | ~310 KB |

---

## 🎨 Design Philosophy

- **Premium SaaS Look**: Inspired by modern admin dashboards
- **Glassmorphism**: Semi-transparent cards with backdrop blur
- **Dark Mode First**: Professional dark theme as default
- **Animations**: Smooth page transitions and micro-interactions
- **Typography**: Inter font for clean, professional text
- **Color Palette**: Indigo-Violet gradients with cyan accents

---

## 📄 License

This project is built for educational purposes — college projects, hackathons, and institutional deployment demonstrations.

---

<div align="center">
  <b>Built with ❤️ for educational institutions</b>
</div>
