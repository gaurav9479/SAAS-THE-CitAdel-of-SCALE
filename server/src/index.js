import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import complaintRoutes from './routes/complaintRoutes.js';
import authRoutes from './routes/authRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import orgRoutes from './routes/orgRoutes.js';
import otpRoutes from './routes/otpRoutes.js';

const app = express();

// Build allowed origins from environment and defaults
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  // Add production frontend URL from environment variable
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  // Support multiple frontend URLs (comma-separated)
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',').map(url => url.trim()) : []),
]);

const corsOptions = {
  origin(origin, cb) {
    if (!origin || allowedOrigins.has(origin)) return cb(null, true);
    return cb(null, false);
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};


app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('❌ MONGO_URI not set in environment');
  console.error('Please set MONGO_URI in your Render environment variables.');
  console.error('Format: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
  process.exit(1);
}

// Validate MongoDB URI format
if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
  console.error('❌ Invalid MONGO_URI format');
  console.error('MONGO_URI must start with "mongodb://" or "mongodb+srv://"');
  console.error('Current value:', mongoUri.substring(0, 20) + '...');
  console.error('Please check your MongoDB Atlas connection string in Render environment variables.');
  process.exit(1);
}

console.log('Connecting to MongoDB...');
mongoose.connect(mongoUri).then(() => {
  console.log('✅ MongoDB connected successfully');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('');
  console.error('Troubleshooting steps:');
  console.error('1. Verify MONGO_URI is correct in Render environment variables');
  console.error('2. Check MongoDB Atlas Network Access allows 0.0.0.0/0 (or Render IPs)');
  console.error('3. Verify database username and password are correct');
  console.error('4. Ensure database name exists in connection string');
  console.error('5. URL-encode special characters in password (e.g., @ becomes %40)');
  console.error('');
  console.error('Example MONGO_URI format:');
  console.error('mongodb+srv://username:password@cluster.mongodb.net/caravan_chronicle?retryWrites=true&w=majority');
  process.exit(1);
});

app.get('/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/otp', otpRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 API listening on :${port}`);
});