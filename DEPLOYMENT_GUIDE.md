# 🚀 Deployment Guide: SAAS-THE-CitAdel-of-SCALE

Complete guide for deploying the frontend to **Vercel** and backend to **Render**.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
3. [Backend Deployment (Render)](#backend-deployment-render)
4. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
5. [Environment Variables Reference](#environment-variables-reference)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [API Documentation](#api-documentation)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **GitHub Repository**: Your code should be pushed to GitHub
- **MongoDB Atlas Account**: Free tier is sufficient
- **Render Account**: For backend hosting
- **Vercel Account**: For frontend hosting
- **Email Service**: Gmail App Password or SMTP service (SendGrid, Mailgun, etc.)
- **Redis** (Optional): For caching (can use Render Redis or Upstash)

---

## Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up/Login
3. Create a **New Project** (e.g., "CitAdel-SCALE")
4. Create a **Free Cluster** (M0)
5. Choose a **Cloud Provider & Region** (preferably same as Render region)

### Step 2: Configure Database Access

1. Go to **Database Access** → **Add New Database User**
2. Choose **Password** authentication
3. Set username and password (save these!)
4. Set privileges: **Atlas admin** (or custom: read/write to any database)
5. Click **Add User**

### Step 3: Configure Network Access

1. Go to **Network Access** → **Add IP Address**
2. For Render deployment, add:
   - `0.0.0.0/0` (allows all IPs - **use only for production**)
   - OR add Render's specific IP ranges (check Render docs)
3. Click **Confirm**

### Step 4: Get Connection String

1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database-name>?retryWrites=true&w=majority
   ```
4. Replace `<username>`, `<password>`, and `<database-name>` with your values
5. **Save this string** - you'll need it for `MONGO_URI`

---

## Backend Deployment (Render)

### Step 1: Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select the repository: `SAAS-THE-CitAdel-of-SCALE`

### Step 2: Configure Render Settings

Fill in the following configuration:

| Field | Value |
|-------|-------|
| **Name** | `SAAS-THE-CitAdel-of-SCALE` (or your preferred name) |
| **Region** | `Virginia (US East)` (or closest to your users) |
| **Branch** | `main` (or your production branch) |
| **Root Directory** | `server` ⚠️ **IMPORTANT: Set this!** |
| **Runtime** | `Node` |
| **Build Command** | `npm install` (or `yarn install` if using yarn) |
| **Start Command** | `npm start` (or `yarn start`) |
| **Instance Type** | `Free` (or upgrade for production) |

### Step 3: Environment Variables (Backend)

Add these environment variables in Render's **Environment** section:

#### Required Variables

```env
# Server Configuration
PORT=5000
# Note: Render will override PORT automatically, but keep it for local dev

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/caravan_chronicle?retryWrites=true&w=majority
# Replace with your actual MongoDB Atlas connection string

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long-for-security
# Generate a strong random string (e.g., use: openssl rand -base64 32)
```

#### Optional Variables (Email)

```env
# Email Configuration (for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
EMAIL_FROM=your-email@gmail.com

# SMTP Configuration (if using custom SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Optional Variables (Redis - for caching)

```env
# Redis Configuration (optional, for performance)
# ⚠️ IMPORTANT: Redis is OPTIONAL. The app will work without it (caching disabled).
# Only set this if you have a Redis service configured.
REDIS_URL=redis://default:password@your-redis-host:6379
# If using Render Redis: Get URL from Render Redis dashboard
# If using Upstash: Get URL from Upstash dashboard
# If NOT SET: App will work fine, just without caching (slower but functional)
```

#### Optional Variables (Development)

```env
# Development helpers
DEV_RETURN_OTP=true
# Set to 'true' to return OTP in response (for testing only)
```

### Step 4: Deploy

1. Click **Create Web Service**
2. Render will:
   - Clone your repository
   - Install dependencies (`npm install` in `server/` directory)
   - Start the server (`npm start`)
3. Wait for deployment to complete (usually 2-5 minutes)
4. Your backend URL will be: `https://your-app-name.onrender.com`

### Step 5: Verify Backend Deployment

1. Check the **Logs** tab in Render
2. You should see: `MongoDB connected` and `API listening on :5000`
3. Test health endpoint:
   ```bash
   curl https://your-app-name.onrender.com/health
   ```
   Should return: `{"ok":true}`

### Step 6: Update CORS Configuration

⚠️ **IMPORTANT**: Update `server/src/index.js` to allow your Vercel frontend URL:

```javascript
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://your-frontend-app.vercel.app', // Add your Vercel URL here
]);
```

**Or** use environment variable for dynamic CORS:

```javascript
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
]);
```

Then add to Render environment variables:
```env
FRONTEND_URL=https://your-frontend-app.vercel.app
```

---

## Frontend Deployment (Vercel)

### Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository: `SAAS-THE-CitAdel-of-SCALE`

### Step 2: Configure Vercel Settings

| Field | Value |
|-------|-------|
| **Framework Preset** | `Vite` (auto-detected) |
| **Root Directory** | `client` ⚠️ **IMPORTANT: Set this!** |
| **Build Command** | `npm run build` (or `yarn build`) |
| **Output Directory** | `dist` (Vite default) |
| **Install Command** | `npm install` (or `yarn install`) |

### Step 3: Environment Variables (Frontend)

Add these in Vercel's **Environment Variables** section:

#### Required Variables

```env
# API Base URL (your Render backend URL)
VITE_API_BASE_URL=https://your-app-name.onrender.com
# Replace with your actual Render backend URL
```

### Step 4: Deploy

1. Click **Deploy**
2. Vercel will:
   - Install dependencies (`npm install` in `client/` directory)
   - Build the app (`npm run build`)
   - Deploy to CDN
3. Your frontend URL will be: `https://your-app-name.vercel.app`

### Step 5: Verify Frontend Deployment

1. Visit your Vercel URL
2. Check browser console for any errors
3. Try logging in (if you have seed data)

---

## Environment Variables Reference

### Backend (Render) - Complete List

```env
# ============================================
# REQUIRED VARIABLES
# ============================================

PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# ============================================
# OPTIONAL VARIABLES
# ============================================

# Email (for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Redis (for caching - optional)
REDIS_URL=redis://default:password@host:6379

# CORS (for frontend URL)
FRONTEND_URL=https://your-frontend-app.vercel.app

# Development
DEV_RETURN_OTP=false
```

### Frontend (Vercel) - Complete List

```env
# ============================================
# REQUIRED VARIABLES
# ============================================

VITE_API_BASE_URL=https://your-backend-app.onrender.com
```

---

## Post-Deployment Configuration

### 1. Seed Initial Data (Optional)

After backend is deployed, you can seed initial data:

```bash
# SSH into Render or use Render Shell
cd server
npm run seed
```

Or create an admin user via API:

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

### 2. Update Frontend API URL

Ensure `client/src/api/client.js` uses the environment variable:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050',
});
```

### 3. Test Full Flow

1. **Register a user** on frontend
2. **Login** and verify JWT token
3. **Create a complaint** as citizen
4. **View complaints** as staff/admin
5. **Test API endpoints** via browser network tab

---

## API Documentation

### Current Status

⚠️ **No Swagger/OpenAPI documentation is currently configured.**

### API Endpoints Overview

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/otp/send` - Send OTP for verification
- `POST /api/otp/verify` - Verify OTP

#### Complaints
- `GET /api/complaints` - List complaints (with filters)
- `GET /api/complaints/mine` - Get user's complaints
- `GET /api/complaints/:id` - Get complaint details
- `POST /api/complaints` - Create new complaint
- `PATCH /api/complaints/:id/status` - Update complaint status

#### Staff
- `GET /api/staff/nearby` - Find nearby staff for location
- `POST /api/staff/assign` - Assign staff to complaint

#### Departments
- `GET /api/departments` - List all departments

#### Users
- `GET /api/users/:id` - Get user profile
- `PATCH /api/users/:id` - Update user profile

#### Reviews
- `POST /api/reviews` - Submit review for resolved complaint
- `GET /api/reviews/staff/:id` - Get staff reviews

#### Analytics
- `GET /api/analytics/summary` - Get analytics summary
- `GET /api/analytics/heatmap` - Get heatmap data
- `GET /api/analytics/categories` - Get category statistics

#### Organizations
- `GET /api/orgs/:id` - Get organization details
- `PATCH /api/orgs/:id/plan` - Update organization plan

### Adding Swagger Documentation (Future Enhancement)

To add Swagger documentation, install:

```bash
npm install swagger-ui-express swagger-jsdoc
```

Then create `server/src/config/swagger.js` and configure routes.

---

## Database Information

### Database: MongoDB

- **Type**: NoSQL Document Database
- **Provider**: MongoDB Atlas (Cloud) or Local MongoDB
- **Database Name**: `caravan_chronicle` (or as specified in MONGO_URI)
- **Collections**:
  - `users` - All user accounts (citizens, staff, admins)
  - `complaints` - Civic complaints and lifecycle
  - `departments` - 47 civic departments
  - `reviews` - Citizen feedback on staff
  - `organizations` - Organization/tenant data

### Indexes (Auto-created)

- `users.email` - Unique index
- `complaints.createdAt` - Descending index
- `complaints.status` - Index for filtering
- `complaints.assignedDepartmentId` - Index for department queries
- `complaints.assignedTo` - Index for staff assignments
- `complaints.category` - Index for category filtering
- `complaints.location.lat/lng` - Geospatial index
- `reviews.staffId` - Index for staff performance
- `reviews.complaintId` - Unique index (one review per complaint)

---

## Constraints & Considerations

### Render (Backend)

1. **Free Tier Limitations**:
   - Service spins down after 15 minutes of inactivity
   - First request after spin-down takes ~30-50 seconds (cold start)
   - 750 hours/month free
   - 512 MB RAM

2. **Environment Variables**:
   - Maximum 100 environment variables per service
   - Values are encrypted at rest

3. **Build Timeout**:
   - Free tier: 10 minutes
   - Paid tier: 45 minutes

4. **Auto-Deploy**:
   - Enabled by default on `main` branch pushes
   - Can disable or set to manual

### Vercel (Frontend)

1. **Free Tier Limitations**:
   - 100 GB bandwidth/month
   - Unlimited requests
   - 100 serverless function executions/day

2. **Build Timeout**:
   - Free tier: 45 seconds
   - Pro tier: 5 minutes

3. **Environment Variables**:
   - Must be prefixed with `VITE_` for Vite to expose them
   - Can be set per environment (production, preview, development)

### General Considerations

1. **CORS**: Must configure backend to allow frontend origin
2. **HTTPS**: Both Render and Vercel provide HTTPS automatically
3. **Cold Starts**: Render free tier has cold starts (~30-50s)
4. **Database**: MongoDB Atlas free tier (M0) has 512 MB storage
5. **Redis**: **OPTIONAL** - App works without it! Only set `REDIS_URL` if you have Redis configured. Without Redis, caching is disabled but the app functions normally.

---

## Troubleshooting

### Backend Issues

#### Redis Connection Error
```
Redis Client Error Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**: 
- ✅ **Redis is OPTIONAL** - The app works without it!
- ✅ **Option 1**: Remove `REDIS_URL` environment variable (app will work without caching)
- ✅ **Option 2**: Set up Redis service:
  - Use Render Redis (paid) or Upstash (free tier available)
  - Add `REDIS_URL` environment variable with correct connection string
- ✅ The app automatically handles Redis being unavailable - caching is disabled gracefully

#### MongoDB Connection Failed
```
Error: MongoDB connection error
```
**Solution**:
1. Check `MONGO_URI` is correct
2. Verify MongoDB Atlas network access allows `0.0.0.0/0` or Render IPs
3. Check database user credentials
4. Ensure database name exists in connection string

#### Port Already in Use
```
Error: Port 5000 already in use
```
**Solution**: Render automatically sets `PORT` environment variable. Remove hardcoded port or use `process.env.PORT || 5000`.

#### CORS Errors
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
**Solution**:
1. Add frontend URL to `allowedOrigins` in `server/src/index.js`
2. Or use `FRONTEND_URL` environment variable
3. Redeploy backend

### Frontend Issues

#### API Calls Failing
```
Network Error or 404 Not Found
```
**Solution**:
1. Check `VITE_API_BASE_URL` is set correctly in Vercel
2. Verify backend URL is accessible: `curl https://your-backend.onrender.com/health`
3. Check browser console for CORS errors
4. Ensure backend CORS allows frontend origin

#### Build Fails
```
Build Error: Module not found
```
**Solution**:
1. Check `Root Directory` is set to `client` in Vercel
2. Verify `package.json` exists in `client/` directory
3. Check build logs for specific missing dependencies

#### Environment Variables Not Working
```
undefined or empty values
```
**Solution**:
1. Ensure variables are prefixed with `VITE_` for Vite
2. Redeploy after adding environment variables
3. Check variable names match exactly (case-sensitive)

### Database Issues

#### Seed Script Fails
```
Error: Cannot connect to database
```
**Solution**:
1. Run seed script locally with correct `MONGO_URI`
2. Or use Render Shell to run: `cd server && npm run seed`
3. Check MongoDB Atlas connection string

---

## Quick Reference: Deployment Checklist

### Backend (Render)
- [ ] Repository connected to Render
- [ ] Root Directory set to `server`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] `MONGO_URI` environment variable set
- [ ] `JWT_SECRET` environment variable set
- [ ] `FRONTEND_URL` environment variable set (for CORS)
- [ ] Optional: `EMAIL_USER`, `EMAIL_PASS` set
- [ ] Optional: `REDIS_URL` set
- [ ] CORS updated in `server/src/index.js`
- [ ] Deployment successful
- [ ] Health endpoint returns `{"ok":true}`

### Frontend (Vercel)
- [ ] Repository connected to Vercel
- [ ] Root Directory set to `client`
- [ ] Framework Preset: `Vite`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] `VITE_API_BASE_URL` environment variable set
- [ ] Deployment successful
- [ ] Frontend loads without errors
- [ ] API calls work (check network tab)

### Post-Deployment
- [ ] Test user registration
- [ ] Test user login
- [ ] Test complaint creation
- [ ] Test complaint viewing
- [ ] Verify CORS is working
- [ ] Check backend logs for errors
- [ ] Check frontend console for errors

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Project README**: See `README.md` for detailed feature documentation

---

## Summary

### Backend (Render) Configuration

```
Name: SAAS-THE-CitAdel-of-SCALE
Root Directory: server
Build Command: npm install
Start Command: npm start
Environment Variables:
  - MONGO_URI (required)
  - JWT_SECRET (required)
  - FRONTEND_URL (required for CORS)
  - EMAIL_USER, EMAIL_PASS (optional)
  - REDIS_URL (optional)
```

### Frontend (Vercel) Configuration

```
Root Directory: client
Framework: Vite
Build Command: npm run build
Output Directory: dist
Environment Variables:
  - VITE_API_BASE_URL (required)
```

---

**Happy Deploying! 🚀**

