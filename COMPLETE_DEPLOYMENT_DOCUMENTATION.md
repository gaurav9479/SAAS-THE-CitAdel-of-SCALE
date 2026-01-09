# 📚 Complete Deployment & Product Documentation
## SAAS-THE-CitAdel-of-SCALE

**Last Updated**: 2024  
**Version**: 1.0.0

---

## 📋 Table of Contents

1. [Product Overview](#product-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Environment Variables](#environment-variables)
6. [Deployment Guide](#deployment-guide)
   - [MongoDB Atlas Setup](#mongodb-atlas-setup)
   - [Backend Deployment (Render)](#backend-deployment-render)
   - [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
7. [API Documentation](#api-documentation)
8. [Configuration Files](#configuration-files)
9. [Post-Deployment Setup](#post-deployment-setup)
10. [Troubleshooting](#troubleshooting)
11. [Constraints & Limitations](#constraints--limitations)

---

## Product Overview

**SAAS-THE-CitAdel-of-SCALE** is a comprehensive grievance redressal and city management system designed for organizations that function like mobile cities (e.g., traveling circuses, festivals, events).

### Key Features

- **Multi-Role System**: Citizens, Staff, and Admins with role-based access
- **Complaint Management**: Complete lifecycle from submission to resolution
- **Location-Aware Assignment**: OLA/Uber-style staff matching based on proximity
- **SLA Tracking**: Automatic deadline calculation and escalation
- **Performance Analytics**: Staff ratings, reviews, and performance metrics
- **Real-Time Updates**: Status tracking and notifications
- **Subscription Plans**: Organization-level plans (Free, God Mode, Titan)

### User Roles

| Role | Capabilities |
|------|-------------|
| **Citizen** | File complaints, track status, rate staff, view dashboard |
| **Staff** | View assigned complaints, update status, manage work area |
| **Admin** | Full system access, analytics, user management, reports |

---

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Caching**: Redis (optional)
- **Email**: Nodemailer
- **Validation**: libphonenumber-js

### Frontend
- **Framework**: React 19.2.3
- **Build Tool**: Vite 5.4.10
- **Styling**: TailwindCSS 3.4.14
- **Routing**: React Router DOM 6.30.2
- **HTTP Client**: Axios 1.12.2
- **Maps**: Leaflet.js + React-Leaflet
- **Phone Input**: react-phone-number-input

### Infrastructure
- **Backend Hosting**: Render
- **Frontend Hosting**: Vercel
- **Database**: MongoDB Atlas
- **Cache**: Redis (Render Redis or Upstash)

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                     │
│  React + Vite + TailwindCSS                             │
│  - Citizen Portal                                        │
│  - Staff Dashboard                                       │
│  - Admin Dashboard                                       │
│  - Map Visualization (Leaflet)                          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     │ API Calls (Axios)
                     │ JWT Authentication
┌────────────────────▼────────────────────────────────────┐
│                 Backend (Render)                        │
│  Node.js + Express.js                                   │
│  - RESTful APIs                                          │
│  - JWT Authentication Middleware                        │
│  - Business Logic                                       │
│  - File Upload Handling                                 │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐    ┌────────▼────────┐
│  MongoDB Atlas  │    │   Redis Cache   │
│  (Database)     │    │   (Optional)    │
│                 │    │                 │
│  - Users        │    │  - API Cache    │
│  - Complaints   │    │  - Session      │
│  - Departments  │    │                 │
│  - Reviews      │    │                 │
│  - Organizations│    │                 │
└─────────────────┘    └─────────────────┘
```

### Folder Structure

```
SAAS-THE-CitAdel-of-SCALE/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── api/              # API client (Axios)
│   │   ├── auth/             # Authentication context
│   │   ├── components/       # Reusable components
│   │   ├── screens/          # Page components
│   │   ├── router/           # Route configuration
│   │   └── main.jsx          # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                    # Backend application
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth middleware
│   │   ├── utils/            # Utilities (JWT, email, redis)
│   │   ├── seed/            # Database seeding
│   │   └── index.js          # Express app entry
│   ├── package.json
│   └── .env                  # Environment variables (not in git)
│
├── README.md                 # Project overview
├── DEPLOYMENT_GUIDE.md      # Detailed deployment guide
├── DEPLOYMENT_QUICK_REFERENCE.md  # Quick reference
└── COMPLETE_DEPLOYMENT_DOCUMENTATION.md  # This file
```

---

## Database Schema

### Database: MongoDB

**Database Name**: `caravan_chronicle` (or as specified in MONGO_URI)

### Collections

#### 1. Users Collection (`users`)

Stores all user accounts (citizens, staff, admins).

```javascript
{
  _id: ObjectId,
  name: String,                    // Required
  email: String,                   // Required, unique, lowercase
  password: String,                // Required, bcrypt hashed
  role: String,                    // 'citizen' | 'staff' | 'admin'
  departmentId: ObjectId,          // Staff only: ref to Department
  organizationId: ObjectId,       // Ref to Organization
  
  // Staff-specific fields
  staff: {
    title: String,
    skills: [String],
    shiftStart: String,            // e.g., '09:00'
    shiftEnd: String,              // e.g., '18:00'
    isWorkingToday: Boolean,       // Default: true
    workArea: {
      city: String,
      zones: [String],
      location: {
        lat: Number,               // Required for staff
        lng: Number                // Required for staff
      }
    },
    contactPhone: String,          // Public contact
    contactEmail: String           // Public contact
  },
  
  // Performance tracking
  ratings: {
    average: Number,               // Default: 0
    count: Number                  // Default: 0
  },
  
  // Profile information
  profile: {
    avatarUrl: String,
    phone: String,                 // Private phone
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      zip: String
    },
    bio: String
  },
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `email` (unique)
- `role`
- `departmentId`
- `organizationId`

#### 2. Complaints Collection (`complaints`)

Stores all civic complaints and their lifecycle.

```javascript
{
  _id: ObjectId,
  title: String,                   // Required
  description: String,              // Required
  category: String,                // Required (from 47 categories)
  priority: String,                // 'LOW' | 'MEDIUM' | 'HIGH'
  
  // Location
  location: {
    lat: Number,                   // Required
    lng: Number                    // Required
  },
  
  // Attachments
  attachments: [{
    url: String,
    type: String
  }],
  
  // Status lifecycle
  status: String,                  // 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  
  // Assignment
  createdBy: ObjectId,             // Required, ref to User
  reporterSnapshot: {
    name: String,
    phone: String,
    email: String
  },
  assignedDepartmentId: ObjectId,  // Ref to Department
  assignedTo: ObjectId,            // Ref to User (staff)
  
  // SLA tracking
  slaDeadline: Date,
  resolutionTime: Date,
  
  // History
  statusHistory: [{
    at: Date,
    by: ObjectId,                  // Ref to User
    from: String,
    to: String,
    note: String
  }],
  
  escalations: [{
    level: Number,
    at: Date,
    to: ObjectId                   // Ref to User
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `createdAt` (descending)
- `status`
- `assignedDepartmentId`
- `assignedTo`
- `category`
- `location.lat`, `location.lng` (geospatial)
- `createdBy`

#### 3. Departments Collection (`departments`)

47 civic departments with their responsibilities.

```javascript
{
  _id: ObjectId,
  name: String,                    // Required
  code: String,                    // Required, unique
  categoriesHandled: [String],     // Indexed
  slaPolicyHours: Number,          // Default: 72
  managerId: ObjectId,             // Ref to User
  contactEmail: String,
  contactPhone: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `code` (unique)
- `categoriesHandled`

#### 4. Reviews Collection (`reviews`)

Citizen feedback on staff performance.

```javascript
{
  _id: ObjectId,
  complaintId: ObjectId,           // Required, ref to Complaint, unique
  staffId: ObjectId,               // Required, ref to User
  citizenId: ObjectId,             // Required, ref to User
  
  // Ratings (1-5 scale)
  rating: Number,                  // Required, min: 1, max: 5
  resolutionQuality: Number,       // min: 1, max: 5
  timeliness: Number,             // min: 1, max: 5
  communication: Number,           // min: 1, max: 5
  comment: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `staffId`
- `complaintId` (unique)
- `citizenId`

#### 5. Organizations Collection (`organizations`)

Organization/tenant data for multi-tenancy.

```javascript
{
  _id: ObjectId,
  name: String,
  code: String,                    // Unique organization code
  plan: String,                    // 'free' | 'god' | 'titan'
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `code` (unique)

---

## Environment Variables

### Backend Environment Variables (Render)

#### Required Variables

```env
# Server Configuration
PORT=5000
# Note: Render automatically sets PORT, but keep for local dev

# Database Connection
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/caravan_chronicle?retryWrites=true&w=majority
# Format: mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
# Replace username, password, cluster, and database name

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-for-security
# Generate using: openssl rand -base64 32
# Must be at least 32 characters for security

# CORS Configuration
FRONTEND_URL=https://your-frontend-app.vercel.app
# Your Vercel frontend URL (for CORS)
# Can also use FRONTEND_URLS for multiple URLs (comma-separated)
```

#### Optional Variables

```env
# Email Configuration (for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# SMTP Configuration (if using custom SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
# SMTP_SECURE: 'true' for port 465, 'false' for 587/STARTTLS

# Redis Configuration (for caching - optional)
REDIS_URL=redis://default:password@host:6379
# Render Redis: Get URL from Render Redis dashboard
# Upstash: Get URL from Upstash dashboard
# Local: redis://127.0.0.1:6379

# Development Helpers
DEV_RETURN_OTP=false
# Set to 'true' to return OTP in response (testing only)
```

### Frontend Environment Variables (Vercel)

#### Required Variables

```env
# API Base URL
VITE_API_BASE_URL=https://your-backend-app.onrender.com
# Must be prefixed with VITE_ for Vite to expose it
# Replace with your actual Render backend URL
```

**Important**: All frontend environment variables must be prefixed with `VITE_` to be accessible in the React app.

---

## Deployment Guide

### Prerequisites

- ✅ GitHub repository with code pushed
- ✅ MongoDB Atlas account (free tier sufficient)
- ✅ Render account (for backend)
- ✅ Vercel account (for frontend)
- ✅ Email service credentials (Gmail App Password or SMTP)
- ✅ (Optional) Redis service (Render Redis or Upstash)

---

### MongoDB Atlas Setup

#### Step 1: Create Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up/Login
3. Create **New Project** (e.g., "CitAdel-SCALE")
4. Create **Free Cluster (M0)**
5. Choose **Cloud Provider & Region** (preferably same as Render region)

#### Step 2: Database Access

1. Go to **Database Access** → **Add New Database User**
2. Choose **Password** authentication
3. Set username and password (**save these!**)
4. Set privileges: **Atlas admin** (or custom read/write)
5. Click **Add User**

#### Step 3: Network Access

1. Go to **Network Access** → **Add IP Address**
2. For production: Add `0.0.0.0/0` (allows all IPs)
   - ⚠️ **Security Note**: For production, consider restricting to specific IPs
3. Click **Confirm**

#### Step 4: Get Connection String

1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Copy connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database-name>?retryWrites=true&w=majority
   ```
4. Replace:
   - `<username>` → Your database username
   - `<password>` → Your database password (URL-encode if special chars)
   - `<database-name>` → `caravan_chronicle` (or your preferred name)
5. **Save this string** - you'll use it as `MONGO_URI`

**Example**:
```
mongodb+srv://admin:Gaurav%402005@cluster0.xxxxx.mongodb.net/caravan_chronicle?retryWrites=true&w=majority
```

---

### Backend Deployment (Render)

#### Step 1: Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select: `SAAS-THE-CitAdel-of-SCALE`

#### Step 2: Configure Settings

Fill in these **exact values**:

| Field | Value |
|-------|-------|
| **Name** | `SAAS-THE-CitAdel-of-SCALE` |
| **Region** | `Virginia (US East)` (or closest to users) |
| **Branch** | `main` |
| **Root Directory** | `server` ⚠️ **CRITICAL** |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (upgrade for production) |

#### Step 3: Add Environment Variables

Click **Environment** tab and add:

**Required**:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/caravan_chronicle?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
FRONTEND_URL=https://your-frontend-app.vercel.app
```

**Optional**:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
REDIS_URL=redis://default:password@host:6379
```

#### Step 4: Deploy

1. Click **Create Web Service**
2. Render will:
   - Clone repository
   - Install dependencies (`npm install` in `server/`)
   - Start server (`npm start`)
3. Wait 2-5 minutes for deployment
4. Your backend URL: `https://your-app-name.onrender.com`

#### Step 5: Verify Deployment

1. Check **Logs** tab
2. Should see:
   ```
   MongoDB connected
   API listening on :5000
   ```
3. Test health endpoint:
   ```bash
   curl https://your-app-name.onrender.com/health
   ```
   Expected: `{"ok":true}`

#### Step 6: Update CORS (After Frontend Deployment)

After deploying frontend, update `FRONTEND_URL` in Render with your Vercel URL.

The CORS configuration in `server/src/index.js` automatically includes:
- Local development URLs
- `FRONTEND_URL` environment variable
- `FRONTEND_URLS` (comma-separated) for multiple URLs

---

### Frontend Deployment (Vercel)

#### Step 1: Create Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import GitHub repository: `SAAS-THE-CitAdel-of-SCALE`

#### Step 2: Configure Settings

Fill in these **exact values**:

| Field | Value |
|-------|-------|
| **Framework Preset** | `Vite` (auto-detected) |
| **Root Directory** | `client` ⚠️ **CRITICAL** |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

#### Step 3: Add Environment Variables

Click **Environment Variables** and add:

```env
VITE_API_BASE_URL=https://your-backend-app.onrender.com
```

**Replace** `your-backend-app` with your actual Render service name.

#### Step 4: Deploy

1. Click **Deploy**
2. Vercel will:
   - Install dependencies (`npm install` in `client/`)
   - Build app (`npm run build`)
   - Deploy to CDN
3. Your frontend URL: `https://your-app-name.vercel.app`

#### Step 5: Verify Deployment

1. Visit your Vercel URL
2. Check browser console (F12) for errors
3. Test login/registration

#### Step 6: Update Backend CORS

Go back to Render and update `FRONTEND_URL` with your Vercel URL, then redeploy.

---

## API Documentation

### Base URL

```
Production: https://your-backend-app.onrender.com
Development: http://localhost:5000
```

### Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <token>
```

### Endpoints Overview

#### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | Register new user | No |
| `POST` | `/api/auth/login` | Login user | No |

**Register Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "citizen"  // Optional: "citizen" | "staff" | "admin"
}
```

**Login Request**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "citizen"
  }
}
```

#### OTP (`/api/otp`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/otp/send` | Send OTP to email | No |
| `POST` | `/api/otp/verify` | Verify OTP | No |

#### Complaints (`/api/complaints`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/complaints` | List complaints (with filters) | Yes |
| `GET` | `/api/complaints/mine` | Get user's complaints | Yes (Citizen) |
| `GET` | `/api/complaints/:id` | Get complaint details | Yes |
| `POST` | `/api/complaints` | Create new complaint | Yes (Citizen) |
| `PATCH` | `/api/complaints/:id/status` | Update complaint status | Yes (Staff/Admin) |

**Query Parameters** (for GET `/api/complaints`):
- `status`: Filter by status (`OPEN`, `IN_PROGRESS`, `RESOLVED`)
- `category`: Filter by category
- `assignedTo`: Filter by staff ID
- `assignedDepartmentId`: Filter by department ID
- `from`: Start date (ISO format)
- `to`: End date (ISO format)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Create Complaint Request**:
```json
{
  "title": "Road has pothole",
  "description": "Large pothole on Main Street",
  "category": "Potholes",
  "priority": "HIGH",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090
  },
  "attachments": [],
  "reporterSnapshot": {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  }
}
```

#### Staff (`/api/staff`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/staff/nearby` | Find nearby staff | Yes |
| `POST` | `/api/staff/assign` | Assign staff to complaint | Yes |

**Nearby Staff Query Parameters**:
- `lat`: Latitude (required)
- `lng`: Longitude (required)
- `category`: Complaint category (required)
- `radius`: Search radius in km (default: 15)

#### Departments (`/api/departments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/departments` | List all departments | Yes |

#### Users (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/users/:id` | Get user profile | Yes |
| `PATCH` | `/api/users/:id` | Update user profile | Yes (Self or Admin) |

#### Reviews (`/api/reviews`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/reviews` | Submit review | Yes (Citizen) |
| `GET` | `/api/reviews/staff/:id` | Get staff reviews | Yes |

**Submit Review Request**:
```json
{
  "complaintId": "...",
  "staffId": "...",
  "rating": 5,
  "resolutionQuality": 5,
  "timeliness": 4,
  "communication": 5,
  "comment": "Great service!"
}
```

#### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/analytics/summary` | Get analytics summary | Yes (Admin) |
| `GET` | `/api/analytics/heatmap` | Get heatmap data | Yes (Admin) |
| `GET` | `/api/analytics/categories` | Get category statistics | Yes (Admin) |

**Query Parameters**:
- `from`: Start date (ISO format)
- `to`: End date (ISO format)

#### Organizations (`/api/orgs`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/orgs/:id` | Get organization | Yes |
| `PATCH` | `/api/orgs/:id/plan` | Update plan | Yes (Admin) |

**Update Plan Request**:
```json
{
  "plan": "god"  // "free" | "god" | "titan"
}
```

#### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/health` | Health check | No |

**Response**:
```json
{
  "ok": true
}
```

### Error Responses

All errors follow this format:

```json
{
  "message": "Error description",
  "code": "ERROR_CODE",  // Optional
  "details": {}  // Optional
}
```

**Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Configuration Files

### Backend Configuration

#### `server/package.json`

```json
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "seed": "node src/seed/seed.js"
  },
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "libphonenumber-js": "^1.12.31",
    "mongoose": "^8.20.3",
    "morgan": "^1.10.1",
    "multer": "^2.0.2",
    "nodemailer": "^7.0.11",
    "redis": "^5.10.0"
  }
}
```

#### `server/src/index.js` (CORS Configuration)

The CORS configuration supports:
- Local development URLs (localhost:5173, localhost:5174)
- `FRONTEND_URL` environment variable
- `FRONTEND_URLS` (comma-separated) for multiple URLs

### Frontend Configuration

#### `client/package.json`

```json
{
  "name": "client",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.12.2",
    "leaflet": "^1.9.4",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-leaflet": "^5.0.0",
    "react-router-dom": "^6.30.2"
  }
}
```

#### `client/src/api/client.js`

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050',
});

// JWT token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## Post-Deployment Setup

### 1. Seed Initial Data

After backend deployment, seed initial data:

**Option A: Via Render Shell**
1. Go to Render dashboard → Your service → **Shell**
2. Run:
   ```bash
   cd server
   npm run seed
   ```

**Option B: Via API**
```bash
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@example.com",
    "password": "ChangeMe123!",
    "role": "admin"
  }'
```

### 2. Test Full Flow

1. **Register** a user on frontend
2. **Login** and verify JWT token
3. **Create complaint** as citizen
4. **View complaints** as staff/admin
5. **Test API endpoints** via browser network tab

### 3. Verify Environment Variables

**Backend (Render)**:
- ✅ `MONGO_URI` is set
- ✅ `JWT_SECRET` is set
- ✅ `FRONTEND_URL` matches your Vercel URL

**Frontend (Vercel)**:
- ✅ `VITE_API_BASE_URL` matches your Render URL

### 4. Check Logs

**Backend (Render)**:
- Check **Logs** tab for:
  - `MongoDB connected`
  - `API listening on :5000`
  - No errors

**Frontend (Vercel)**:
- Check browser console (F12) for:
  - No CORS errors
  - No network errors
  - API calls succeeding

---

## Troubleshooting

### Backend Issues

#### MongoDB Connection Failed
```
Error: MongoDB connection error
```

**Solutions**:
1. ✅ Check `MONGO_URI` format is correct
2. ✅ Verify MongoDB Atlas network access allows `0.0.0.0/0` or Render IPs
3. ✅ Check database user credentials
4. ✅ Ensure database name exists in connection string
5. ✅ URL-encode special characters in password

#### Port Already in Use
```
Error: Port 5000 already in use
```

**Solution**: Render automatically sets `PORT`. Ensure code uses `process.env.PORT || 5000`.

#### CORS Errors
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**Solutions**:
1. ✅ Add frontend URL to `FRONTEND_URL` in Render environment variables
2. ✅ Verify `FRONTEND_URL` matches your Vercel URL exactly (including `https://`)
3. ✅ Redeploy backend after adding `FRONTEND_URL`
4. ✅ Check `server/src/index.js` CORS configuration

#### Build Fails
```
Build Error: Module not found
```

**Solutions**:
1. ✅ Check **Root Directory** is set to `server` in Render
2. ✅ Verify `package.json` exists in `server/` directory
3. ✅ Check build logs for specific missing dependencies
4. ✅ Ensure Node.js version is 18+ (Render auto-detects)

### Frontend Issues

#### API Calls Failing
```
Network Error or 404 Not Found
```

**Solutions**:
1. ✅ Check `VITE_API_BASE_URL` is set correctly in Vercel
2. ✅ Verify backend URL is accessible: `curl https://your-backend.onrender.com/health`
3. ✅ Check browser console for CORS errors
4. ✅ Ensure backend CORS allows frontend origin
5. ✅ Verify `VITE_` prefix on environment variable

#### Build Fails
```
Build Error: Module not found
```

**Solutions**:
1. ✅ Check **Root Directory** is set to `client` in Vercel
2. ✅ Verify `package.json` exists in `client/` directory
3. ✅ Check build logs for specific missing dependencies
4. ✅ Ensure Node.js version is 18+ (Vercel auto-detects)

#### Environment Variables Not Working
```
undefined or empty values
```

**Solutions**:
1. ✅ Ensure variables are prefixed with `VITE_` for Vite
2. ✅ Redeploy after adding environment variables
3. ✅ Check variable names match exactly (case-sensitive)
4. ✅ Verify variables are set for **Production** environment in Vercel

### Database Issues

#### Seed Script Fails
```
Error: Cannot connect to database
```

**Solutions**:
1. ✅ Run seed script locally with correct `MONGO_URI`
2. ✅ Use Render Shell: `cd server && npm run seed`
3. ✅ Check MongoDB Atlas connection string
4. ✅ Verify network access allows Render IPs

#### Collections Not Created

**Solution**: Collections are created automatically by Mongoose when first document is inserted. No manual creation needed.

---

## Constraints & Limitations

### Render (Backend) - Free Tier

| Constraint | Limit |
|-----------|-------|
| **Inactivity Spin-down** | 15 minutes |
| **Cold Start Time** | ~30-50 seconds |
| **Monthly Hours** | 750 hours |
| **RAM** | 512 MB |
| **Build Timeout** | 10 minutes |
| **Environment Variables** | 100 max |

**Recommendations**:
- Use **Paid Tier** for production (no spin-down, faster cold starts)
- Consider **Health Check** endpoint to prevent spin-down
- Monitor usage to avoid exceeding 750 hours/month

### Vercel (Frontend) - Free Tier

| Constraint | Limit |
|-----------|-------|
| **Bandwidth** | 100 GB/month |
| **Requests** | Unlimited |
| **Serverless Functions** | 100 executions/day |
| **Build Timeout** | 45 seconds |

**Recommendations**:
- Free tier is usually sufficient for frontend
- Upgrade to **Pro** if exceeding bandwidth limits

### MongoDB Atlas - Free Tier (M0)

| Constraint | Limit |
|-----------|-------|
| **Storage** | 512 MB |
| **RAM** | Shared |
| **Backups** | Not included |
| **Multi-region** | Not available |

**Recommendations**:
- Monitor storage usage
- Upgrade to **M10** for production (10 GB storage, backups)

### General Considerations

1. **CORS**: Must configure backend to allow frontend origin
2. **HTTPS**: Both Render and Vercel provide HTTPS automatically
3. **Cold Starts**: Render free tier has cold starts (~30-50s)
4. **Database**: MongoDB Atlas free tier has 512 MB storage
5. **Redis**: Optional but recommended for caching (use Upstash free tier or Render Redis)
6. **Email**: Gmail App Password or SMTP service required for notifications

---

## Quick Reference Checklist

### Pre-Deployment
- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Network access configured
- [ ] Connection string copied
- [ ] JWT secret generated (`openssl rand -base64 32`)

### Backend (Render)
- [ ] Repository connected
- [ ] Root Directory: `server`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] `MONGO_URI` set
- [ ] `JWT_SECRET` set
- [ ] `FRONTEND_URL` set (after frontend deployment)
- [ ] Optional: `EMAIL_USER`, `EMAIL_PASS` set
- [ ] Optional: `REDIS_URL` set
- [ ] Deployment successful
- [ ] Health endpoint returns `{"ok":true}`

### Frontend (Vercel)
- [ ] Repository connected
- [ ] Root Directory: `client`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] `VITE_API_BASE_URL` set
- [ ] Deployment successful
- [ ] Frontend loads without errors
- [ ] API calls work

### Post-Deployment
- [ ] Backend CORS updated with frontend URL
- [ ] Initial data seeded (admin user)
- [ ] Test user registration
- [ ] Test user login
- [ ] Test complaint creation
- [ ] Test complaint viewing
- [ ] Verify no errors in logs/console

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Project README**: See `README.md` for detailed feature documentation
- **Quick Reference**: See `DEPLOYMENT_QUICK_REFERENCE.md` for copy-paste values

---

## Summary

### Backend (Render) Configuration

```
Name: SAAS-THE-CitAdel-of-SCALE
Root Directory: server
Build Command: npm install
Start Command: npm start
Required Env Vars:
  - MONGO_URI
  - JWT_SECRET
  - FRONTEND_URL
Optional Env Vars:
  - EMAIL_USER, EMAIL_PASS
  - REDIS_URL
```

### Frontend (Vercel) Configuration

```
Root Directory: client
Framework: Vite
Build Command: npm run build
Output Directory: dist
Required Env Vars:
  - VITE_API_BASE_URL
```

### Database

```
Provider: MongoDB Atlas
Database Name: caravan_chronicle
Collections: users, complaints, departments, reviews, organizations
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2024  
**Maintained By**: Development Team

---

**Happy Deploying! 🚀**

