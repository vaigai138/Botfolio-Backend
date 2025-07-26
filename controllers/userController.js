import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { OAuth2Client } from 'google-auth-library';
import { sendWelcomeEmail } from '../utils/emailService.js';

// Initialize Google OAuth2Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🌍 PUBLIC PROFILE
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const publicData = {
      username: user.username,
      name: user.showName ? user.name : null,
      email: user.showEmail ? user.email : null,
      phone: user.showPhone ? user.phone : null,
      role: user.portfolioType || 'both',
      profileImage: user.profileImage || null,
      instagram: user.instagram || '',
      youtube: user.youtube || '',
      tags: user.tags || [],
      shortVideos: user.shortVideos || [],
      longVideos: user.longVideos || [],
      graphicImages: user.graphicImages || [],
      plan: user.plan,
      avatar: user.avatar || null, // Include Google avatar
    };

    res.json(publicData);
  } catch (err) {
    console.error('Public Profile Error:', err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// 🔐 GET LOGGED-IN USER PROFILE
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Get Current User Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 🔐 UPDATE PROFILE (with file upload support)
export const updateUserProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      showEmail,
      showPhone,
      portfolioType,
      shortVideos,
      longVideos,
      tags,
      instagram,
      youtube
    } = req.body;

    const updates = {
      name,
      phone,
      showEmail: showEmail === 'true' || showEmail === true,
      showPhone: showPhone === 'true' || showPhone === true,
      portfolioType,
      instagram: instagram || '',
      youtube: youtube || '',
      shortVideos: Array.isArray(shortVideos) ? shortVideos : shortVideos ? [shortVideos] : [],
      longVideos: Array.isArray(longVideos) ? longVideos : longVideos ? [longVideos] : [],
      tags: Array.isArray(tags) ? tags : tags ? [tags] : []
    };

    let existingDesignImages = [];
    if (req.body.existingDesignImages) {
      try {
        existingDesignImages = JSON.parse(req.body.existingDesignImages);
      } catch (e) {
        existingDesignImages = Array.isArray(req.body.existingDesignImages)
          ? req.body.existingDesignImages
          : [req.body.existingDesignImages];
      }
    }

    if (req.files) {
      const profileFile = req.files.profileImage?.[0];
      const designFiles = req.files.designImages || [];

      if (profileFile) {
        updates.profileImage = `data:${profileFile.mimetype};base64,${profileFile.buffer.toString('base64')}`;
        updates.avatar = ''; // Clear Google avatar if custom profile image is uploaded
      }

      const newDesignImages = designFiles.map((file) =>
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
      );

      const combinedImages = [...existingDesignImages, ...newDesignImages];
      updates.graphicImages = combinedImages.slice(0, 25);
    } else {
      updates.graphicImages = existingDesignImages;
    }

    if (req.body.removeProfileImage === 'true') {
      updates.profileImage = '';
      updates.avatar = ''; // Optional, reset avatar too if removing image
    }


    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      ...user.toObject(),
      plan: {
        name: user.plan?.name || "Free",
        linksAllowed: user.plan?.linksAllowed ?? 5,
        designLimit: user.plan?.designLimit ?? 5
      }
    });

  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('name username profileImage portfolioType createdAt avatar')
      .sort({ createdAt: 1 });

    res.json(users);
  } catch (err) {
    console.error('Error fetching all users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// 🔑 Google Authentication Handler
export const googleAuthController = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Google ID token is missing.' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Google account must have an email address.' });
    }

    let user = await User.findOne({ googleId });

    if (user) {
      // User exists, log them in
      // Update lastLogin on successful Google login
      user.lastLogin = new Date();
      await user.save();

      const jwtToken = generateToken(user._id);
      return res.status(200).json({
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
        token: jwtToken,
        message: 'Login successful via Google.',
        newUser: false,
      });
    }

    user = await User.findOne({ email });

    if (user) {
      // Existing user with this email, link their Google account
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        user.lastLogin = new Date(); // Update lastLogin when linking
        await user.save();
        await sendWelcomeEmail(user.email, user.name);

        const jwtToken = generateToken(user._id);
        return res.status(200).json({
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
          token: jwtToken,
          message: 'Google account linked and login successful.',
          newUser: false,
        });
      } else {
        return res.status(409).json({ message: 'An account with this email already exists and is linked to another Google account.' });
      }
    }

    // New user from Google, needs username.
    res.status(200).json({
      message: 'New user via Google. Please complete your signup.',
      newUser: true,
      user: {
        googleId,
        email,
        name,
        picture,
      },
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google authentication failed.', error: error.message });
  }
};

// 🔑 Complete Google Signup (for new users to set username)
export const completeGoogleSignupController = async (req, res) => {
  const { googleIdToken, username, name, email } = req.body;

  if (!googleIdToken || !username || !name || !email) {
    return res.status(400).json({ message: 'Missing required fields for signup completion.' });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores (no spaces).' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: googleIdToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email: googleEmail, name: googleName, picture: googlePicture } = payload;

    if (email !== googleEmail) {
      return res.status(400).json({ message: 'Email mismatch with Google token.' });
    }

    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(409).json({ message: 'Username is already taken.' });
    }

    const existingUserByGoogleId = await User.findOne({ googleId });
    if (existingUserByGoogleId) {
      return res.status(409).json({ message: 'This Google account is already registered.' });
    }

    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      if (!existingUserByEmail.googleId) {
        existingUserByEmail.googleId = googleId;
        existingUserByEmail.avatar = googlePicture;
        existingUserByEmail.name = name;
        existingUserByEmail.lastLogin = new Date(); // Update lastLogin when linking
        await existingUserByEmail.save();

        await sendWelcomeEmail(existingUserByEmail.email, existingUserByEmail.name);

        const jwtToken = generateToken(existingUserByEmail._id);
        return res.status(200).json({
          user: {
            id: existingUserByEmail._id,
            name: existingUserByEmail.name,
            username: existingUserByEmail.username,
            email: existingUserByEmail.email,
            profileImage: existingUserByEmail.profileImage,
            avatar: existingUserByEmail.avatar,
            plan: existingUserByEmail.plan,
            role: existingUserByEmail.role, // Include role in user object
          },
          token: jwtToken,
          message: 'Existing account linked with Google and login successful.',
          newUser: false,
        });
      } else {
        return res.status(409).json({ message: 'An account with this email already exists and is linked to another Google account.' });
      }
    }

    const newUser = await User.create({
      googleId,
      username,
      email,
      name: name || googleName,
      avatar: googlePicture,
      lastLogin: new Date(), // Set lastLogin for new Google users
    });

    await sendWelcomeEmail(newUser.email, newUser.name);

    const jwtToken = generateToken(newUser._id);
    res.status(201).json({
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        profileImage: newUser.profileImage,
        avatar: newUser.avatar,
        plan: newUser.plan,
        role: newUser.role, // Include role in user object
      },
      token: jwtToken,
      message: 'Google signup complete and login successful.',
      newUser: false,
    });

  } catch (error) {
    console.error('Complete Google signup error:', error);
    res.status(500).json({ message: 'Failed to complete Google signup.', error: error.message });
  }
};