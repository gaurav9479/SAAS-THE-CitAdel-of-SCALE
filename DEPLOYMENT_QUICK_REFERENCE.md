# ⚡ Quick Deployment Reference

Quick copy-paste reference for deploying to Render (Backend) and Vercel (Frontend).

---

## 🎯 Render (Backend) - Exact Values

### Basic Settings

| Field | Value |
|-------|-------|
| **Name** | `SAAS-THE-CitAdel-of-SCALE` |
| **Region** | `Virginia (US East)` |
| **Branch** | `main` |
| **Root Directory** | `server` ⚠️ |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### Environment Variables (Copy these exactly)

```env
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/caravan_chronicle?retryWrites=true&w=majority
JWT_SECRET=YOUR_SECRET_KEY_HERE_MIN_32_CHARACTERS
FRONTEND_URL=https://YOUR_APP_NAME.vercel.app
```

**Optional (Email):**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**Optional (Redis):**
```env
REDIS_URL=redis://default:password@host:6379
```

---

## 🎯 Vercel (Frontend) - Exact Values

### Basic Settings

| Field | Value |
|-------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `client` ⚠️ |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Environment Variables

```env
VITE_API_BASE_URL=https://YOUR_APP_NAME.onrender.com
```

**Replace `YOUR_APP_NAME` with your actual Render service name!**

---

## 📝 Step-by-Step Checklist

### 1. MongoDB Atlas Setup
- [ ] Create cluster
- [ ] Create database user
- [ ] Add network access (`0.0.0.0/0` for production)
- [ ] Copy connection string
- [ ] Replace `<username>`, `<password>`, `<database-name>` in connection string

### 2. Render Backend
- [ ] Connect GitHub repo
- [ ] Set Root Directory: `server`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `npm start`
- [ ] Add `MONGO_URI` environment variable
- [ ] Add `JWT_SECRET` environment variable (generate strong secret)
- [ ] Add `FRONTEND_URL` (will add after Vercel deployment)
- [ ] Deploy and copy backend URL

### 3. Vercel Frontend
- [ ] Connect GitHub repo
- [ ] Set Root Directory: `client`
- [ ] Set Build Command: `npm run build`
- [ ] Set Output Directory: `dist`
- [ ] Add `VITE_API_BASE_URL` with your Render backend URL
- [ ] Deploy and copy frontend URL

### 4. Update Backend CORS
- [ ] Go back to Render
- [ ] Update `FRONTEND_URL` with your Vercel URL
- [ ] Redeploy backend (or it will auto-redeploy)

### 5. Test
- [ ] Visit frontend URL
- [ ] Check browser console for errors
- [ ] Test registration/login
- [ ] Test API calls

---

## 🔑 Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
openssl rand -base64 32
```

Or use an online generator: https://randomkeygen.com/

---

## 🌐 Example URLs

After deployment, your URLs will look like:

- **Backend**: `https://saas-the-citadel-of-scale.onrender.com`
- **Frontend**: `https://saas-the-citadel-of-scale.vercel.app`

Update these in your environment variables accordingly!

---

## ⚠️ Common Mistakes

1. ❌ **Wrong Root Directory**: Must be `server` for Render, `client` for Vercel
2. ❌ **Missing `VITE_` prefix**: Frontend env vars must start with `VITE_`
3. ❌ **Wrong MongoDB URI**: Must include database name and connection options
4. ❌ **CORS errors**: Forgot to set `FRONTEND_URL` in Render
5. ❌ **Build fails**: Check Root Directory is correct

---

## 🆘 Quick Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Check logs in Render dashboard
- Verify `MONGO_URI` is set correctly

### Frontend can't connect to backend
- Check `VITE_API_BASE_URL` matches Render URL
- Check CORS: `FRONTEND_URL` must be set in Render
- Test backend health: `curl https://your-backend.onrender.com/health`

### Build fails
- Check Root Directory is correct (`server` or `client`)
- Check `package.json` exists in that directory
- Check build logs for specific errors

---

**Need more details?** See `DEPLOYMENT_GUIDE.md` for comprehensive documentation.

