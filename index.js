import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js'
import userRoutes from './routes/userRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import paymentRoutes from "./routes/paymentRoutes.js"; // Moved import to top for consistency
import { getAllUsers } from './controllers/userController.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();


const allowedOrigins = [
  'https://botfolio-frontend.netlify.app',
  'https://botfolio.dev'
];

const app = express();


app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for potential image uploads
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increased limit for potential image uploads

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // <-- CHANGED THIS LINE from '/api/users' to '/api/user'
app.use('/api/public', publicRoutes);
app.use("/api/payment", paymentRoutes);
app.get('/api/all-users', getAllUsers);
app.use('/api/admin', adminRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () => console.log(`Server running on ${process.env.PORT}`));
  })
  .catch(err => console.log(err));
