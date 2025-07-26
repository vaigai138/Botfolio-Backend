import User from '../models/User'

export const checkPlanExpiry = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.plan && user.plan.name !== 'free') {
      const purchasedAt = new Date(user.plan.purchasedAt);
      const now = new Date();
      const diffDays = Math.floor((now - purchasedAt) / (1000 * 60 * 60 * 24));

      const limitDays = 30;

      if (diffDays >= limitDays) {
        // Reset plan to free
        user.plan = {
          name: 'free',
          linksAllowed: 5,
          purchasedAt: null,
        };

        // Remove excess links
        user.shortVideos = user.shortVideos.slice(-5);
        user.longVideos = user.longVideos.slice(-5);
        user.graphicImages = user.graphicImages.slice(-5);

        await user.save();
      }
    }

    next();
  } catch (error) {
    console.error("Plan check failed:", error);
    res.status(500).json({ message: 'Plan validation failed' });
  }
};
