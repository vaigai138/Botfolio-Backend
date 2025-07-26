import User from '../models/User.js';
// import Project from '../models/Project.js'; // If you have a separate Project model
// import Payment from '../models/Payment.js'; // If you create a Payment model

// --- 1. User Management ---
export const getAllUsersForAdmin = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching all users for admin:', error);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
};

export const updateUserByAdmin = async (req, res) => {
  const { id } = req.params;
  const { role, accountStatus, portfolioVisibility, name, email, username } = req.body; // Added name, email, username
  // IMPORTANT: Add more validation here (e.g., email uniqueness, username format)

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Prevent admin from changing their own role/status to non-admin or banning self
    if (req.user.id === id.toString() && (role !== 'admin' || accountStatus === 'banned' || accountStatus === 'suspended')) {
      return res.status(403).json({ message: 'Admins cannot change their own role or status to a disabled state.' });
    }

    if (role && ['user', 'admin'].includes(role)) user.role = role;
    if (accountStatus && ['active', 'banned', 'suspended'].includes(accountStatus)) user.accountStatus = accountStatus;
    if (portfolioVisibility && ['public', 'private'].includes(portfolioVisibility)) user.portfolioVisibility = portfolioVisibility;

    // Optional: Allow admin to edit basic user info (handle carefully!)
    if (name) user.name = name;
    if (username) {
        // Add username uniqueness check here if changing username
        const usernameExists = await User.findOne({ username, _id: { $ne: id } });
        if (usernameExists) return res.status(400).json({ message: 'Username is already taken.' });
        user.username = username;
    }
    if (email) {
        // Add email uniqueness check here if changing email
        const emailExists = await User.findOne({ email, _id: { $ne: id } });
        if (emailExists) return res.status(400).json({ message: 'Email is already in use.' });
        user.email = email;
    }


    await user.save();
    const updatedUser = await User.findById(id).select('-password');
    res.status(200).json({ message: 'User updated successfully.', user: updatedUser });

  } catch (error) {
    console.error(`Error updating user ${id}:`, error);
    res.status(500).json({ message: 'Server error updating user.' });
  }
};

export const deleteUserByAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (req.user.id === id.toString()) return res.status(403).json({ message: 'Admins cannot delete their own account.' });

    await user.deleteOne();
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    res.status(500).json({ message: 'Server error deleting user.' });
  }
};

// --- 2. Portfolio Links ---
export const getAllPortfolioLinksForAdmin = async (req, res) => {
    try {
        // If links are directly on User model (like shortVideos, longVideos, graphicImages)
        // You'd fetch users and then iterate their links, or use aggregation if needed.
        const usersWithLinks = await User.find({
            $or: [
                { 'shortVideos.0': { '$exists': true } },
                { 'longVideos.0': { '$exists': true } },
                { 'graphicImages.0': { '$exists': true } }
            ]
        }).select('username email shortVideos longVideos graphicImages');

        // Flatten the data for easier consumption on the frontend
        const allLinks = [];
        usersWithLinks.forEach(user => {
            user.shortVideos.forEach(link => {
                allLinks.push({
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    type: 'shortVideo',
                    url: link,
                    // Add status (e.g., 'active', 'flagged') if you add it to your schema
                });
            });
            user.longVideos.forEach(link => {
                allLinks.push({
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    type: 'longVideo',
                    url: link,
                });
            });
            user.graphicImages.forEach(link => {
                allLinks.push({
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    type: 'graphicImage',
                    url: link,
                });
            });
        });

        res.status(200).json(allLinks);

        // If you had a separate Project/PortfolioItem model:
        // const links = await Project.find().populate('user', 'username email');
        // res.status(200).json(links);

    } catch (error) {
        console.error('Error fetching portfolio links for admin:', error);
        res.status(500).json({ message: 'Server error fetching portfolio links.' });
    }
};

// You'd need a way to identify and update/remove a specific link.
// This is more complex if links are nested in arrays. You might need to
// send the user ID, link type, and the exact URL to remove.
export const removePortfolioLink = async (req, res) => {
    const { userId, type, url } = req.body; // Expect userId, type (shortVideo/longVideo/graphicImage), url
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        let updated = false;
        if (user[type] && Array.isArray(user[type])) {
            const initialLength = user[type].length;
            user[type] = user[type].filter(link => link !== url);
            if (user[type].length < initialLength) {
                updated = true;
            }
        }

        if (updated) {
            await user.save();
            res.status(200).json({ message: 'Portfolio link removed successfully.' });
        } else {
            res.status(404).json({ message: 'Portfolio link not found or type incorrect.' });
        }

    } catch (error) {
        console.error('Error removing portfolio link:', error);
        res.status(500).json({ message: 'Server error removing link.' });
    }
};

// Flagging would require adding a 'status' or 'flagged' field to your links schema/structure.
// export const flagPortfolioLink = async (req, res) => { /* ... */ };


// --- 3. Platform Analytics (from previous response) ---
export const getPlatformAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const activeUsers = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });

        const roleBreakdown = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);

        const portfolioVisibilityStats = await User.aggregate([
            { $group: { _id: "$portfolioVisibility", count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            totalUsers,
            activeUsers,
            roleBreakdown: roleBreakdown.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            portfolioVisibilityStats: portfolioVisibilityStats.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
        });

    } catch (error) {
        console.error('Error fetching platform analytics:', error);
        res.status(500).json({ message: 'Server error fetching analytics.' });
    }
};


// --- 4. Invoices & Payments (Conceptual) ---
// This would depend heavily on your Payment/Subscription model and Razorpay integration
/*

export const updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // e.g., 'completed', 'refunded'
    try {
        const payment = await Payment.findById(id);
        if (!payment) return res.status(404).json({ message: 'Payment not found.' });
        payment.status = status;
        await payment.save();
        res.status(200).json({ message: 'Payment status updated.', payment });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ message: 'Server error updating payment status.' });
    }
};

export const revokeSubscription = async (req, res) => {
    const { userId } = req.body; // Or paymentId
    try {
        // Logic to downgrade user's plan to 'FREE'
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        user.plan.name = 'FREE';
        user.plan.linksAllowed = 5; // Default free plan links
        // Clear renewal date etc.
        await user.save();
        res.status(200).json({ message: 'User subscription revoked to Free plan.' });
    } catch (error) {
        console.error('Error revoking subscription:', error);
        res.status(500).json({ message: 'Server error revoking subscription.' });
    }
};
*/

// --- 5. Admin Settings ---
// For alerts/notices, you might need a simple `Setting` model
/*
// Example: models/Setting.js
const settingSchema = new mongoose.Schema({
    key: { type: String, unique: true, required: true }, // e.g., 'platform_alert_message'
    value: { type: String },
    type: { type: String, enum: ['text', 'boolean'], default: 'text' },
    isActive: { type: Boolean, default: false }
}, { timestamps: true });
const Setting = mongoose.model('Setting', settingSchema);
*/
/*
export const updateAdminPassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const adminUser = await User.findById(req.user.id);
        if (!adminUser) return res.status(404).json({ message: 'Admin user not found.' });

        const isMatch = await bcrypt.compare(currentPassword, adminUser.password);
        if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });

        adminUser.password = await bcrypt.hash(newPassword, 10);
        await adminUser.save();
        res.status(200).json({ message: 'Admin password updated successfully.' });
    } catch (error) {
        console.error('Error updating admin password:', error);
        res.status(500).json({ message: 'Server error updating admin password.' });
    }
};

export const addPlatformNotice = async (req, res) => {
    const { message, isActive } = req.body;
    try {
        let notice = await Setting.findOne({ key: 'platform_alert_message' });
        if (notice) {
            notice.value = message;
            notice.isActive = isActive;
        } else {
            notice = await Setting.create({ key: 'platform_alert_message', value: message, isActive, type: 'text' });
        }
        await notice.save();
        res.status(200).json({ message: 'Platform notice updated successfully.', notice });
    } catch (error) {
        console.error('Error adding platform notice:', error);
        res.status(500).json({ message: 'Server error adding platform notice.' });
    }
};
// Add getPlatformNotice to fetch it
*/