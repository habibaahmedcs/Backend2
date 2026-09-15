const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "الأطباق الرئيسية" },
    price: { type: Number, required: true },
    description: { type: String, trim: true, default: "" },
    imageUrl: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true, trim: true },
    userAvatar: { type: String, trim: true, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: "" },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "اسم المطعم/المطبخ مطلوب"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["restaurant", "home_kitchen"],
      default: "restaurant",
    },
    cuisine: {
      type: String,
      required: [true, "المطبخ/الدولة مطلوب"],
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      required: [true, "العنوان/المحافظة مطلوب"],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    workingHours: {
      type: String,
      trim: true,
      default: "",
    },
    averagePrice: {
      type: Number,
    },
    priceLevel: {
      type: String,
      enum: ["budget", "moderate", "expensive"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    healthCertificate: {
      type: String,
      default: "",
    },
    gallery: {
      type: [String],
      default: [],
    },
    menuCategories: {
      type: [String],
      default: [],
    },
    menu: {
      type: [menuItemSchema],
      default: [],
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "deleted"],
      default: "pending",
    },
    deletedBy: {
      type: String,
      enum: ["admin", "vendor"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

restaurantSchema.methods.recalculateRatings = function () {
  const count = this.reviews.length;
  this.ratingsCount = count;
  if (!count) {
    this.averageRating = 0;
    return;
  }
  const sum = this.reviews.reduce((acc, review) => acc + Number(review.rating || 0), 0);
  this.averageRating = Math.round((sum / count) * 10) / 10;
};

module.exports = mongoose.model("Restaurant", restaurantSchema);
