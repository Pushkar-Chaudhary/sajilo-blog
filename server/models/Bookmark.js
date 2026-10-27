import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      required: true,
    },
  },
  { timestamps: true }
);

// Unique constraint to prevent duplicate bookmarks
bookmarkSchema.index({ user: 1, article: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Bookmark', bookmarkSchema);
