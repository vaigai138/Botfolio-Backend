import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from './routes/adminRoutes.js';
import { getAllUsers } from './controllers/userController.js';

dotenv.config();

const app = express();

// ✅ Enable CORS
app.use(cors({
  origin: ["https://botfolio.dev", "http://localhost:5173"], // allow frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// ✅ Built-in middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ API Routes
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Example endpoint
app.get("/api/all-users", getAllUsers);

// ✅ Health check (Azure pings this)
app.get("/", (req, res) => {
  res.send("Botfolio backend is running 🚀");
});

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error("MongoDB connection error:", err));
