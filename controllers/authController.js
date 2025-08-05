import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '../utils/emailService.js';

export const signup = async (req, res) => {
  const { name, username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: 'Username or Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      lastLogin: new Date(), // Set lastLogin on initial signup
    });

    if (user) {
      await sendWelcomeEmail(user.email, user.name);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d', // Unified to 3 hours to match frontend AuthContext
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        avatar: user.avatar,
        plan: user.plan,
        role: user.role, // Include role in user object
      },
      token
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: err.message || 'Server error during signup.' });
  }
};

export const login = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.googleId && !user.password) {
      return res.status(400).json({ message: 'This account was created with Google. Please log in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Update lastLogin on successful login
    user.lastLogin = new Date();
    await user.save(); // Save the updated user

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' }); // Unified to 3 hours

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        avatar: user.avatar,
        plan: user.plan,
        role: user.role, // Include role in user object
      },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: err.message || 'Server error during login.' });
  }
};
