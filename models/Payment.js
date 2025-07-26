// Example: models/Payment.js (simplified)
import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  razorpayOrderId: { type: String, unique: true, sparse: true },
  razorpayPaymentId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  purchasedAt: { type: Date, default: Date.now },
  renewalDate: { type: Date }, // For subscription plans
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);