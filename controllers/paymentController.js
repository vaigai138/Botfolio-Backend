import crypto from 'crypto';
import { PLANS } from '../config/plans.js';
import User from '../models/User.js'
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planName) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const selectedPlan = PLANS[planName.toLowerCase()];
    if (!selectedPlan) {
      return res.status(400).json({ success: false, message: "Invalid plan selected" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const currentPlan = user.plan?.name;
    const currentExpiry = user.plan?.expiresAt;

    // If user already has the selected plan and it is still active
    if (
      currentPlan === planName &&
      currentExpiry &&
      new Date(currentExpiry) > new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "You already have this plan active.",
      });
    }

    // If current plan exists and hasn't expired → Queue the new one
    if (currentExpiry && new Date(currentExpiry) > new Date()) {
      user.queuedPlan = {
        name: planName,
        linksAllowed: selectedPlan.linksAllowed,
        designLimit: selectedPlan.designLimit,
        startsAt: new Date(currentExpiry),
        paymentDetails: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
      };

      await user.save();

      return res.status(200).json({
        success: true,
        message: `✅ Plan "${planName}" queued. It will activate on ${new Date(currentExpiry).toLocaleDateString()}.`,
      });
    }

    // Else: Activate the plan immediately
    const now = new Date();
    const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    user.plan = {
      name: planName,
      linksAllowed: selectedPlan.linksAllowed,
      designLimit: selectedPlan.designLimit,
      purchasedAt: now,
      expiresAt: expiry,
      paymentDetails: {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      },
    };

    user.queuedPlan = undefined; // Clear any previous queue

    await user.save();

    res.status(200).json({
      success: true,
      message: `🎉 Plan "${planName}" activated until ${expiry.toLocaleDateString()}.`,
    });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};






import Razorpay from 'razorpay';
export const createOrder = async (req, res) => {
  try {
    const { amount, planName } = req.body;

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount,
      currency: 'INR',
      receipt: `receipt_order_${Math.random() * 1000}`,
      notes: {
        planName: planName,
        userId: req.user.id,
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order, // 🟢 return full order object (includes id, amount, etc.)
    });
  } catch (error) {
    console.error('Error in createOrder:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};
