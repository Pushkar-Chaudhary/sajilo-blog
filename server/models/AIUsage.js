import mongoose from 'mongoose';

const aiUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    feature: {
      type: String,
      required: true,
      enum: ['generate', 'rewrite', 'summarize', 'titles', 'outline', 'seo', 'chat', 'tags'],
    },
    inputLength: {
      type: Number,
      default: 0,
    },
    outputLength: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['success', 'error', 'rate_limited'],
      default: 'success',
    },
  },
  { timestamps: true }
);

aiUsageSchema.index({ user: 1, feature: 1, createdAt: -1 });
aiUsageSchema.index({ createdAt: -1 });

export default mongoose.model('AIUsage', aiUsageSchema);
