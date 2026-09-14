const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "اسم المطعم/المطبخ مطلوب"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "نوع النشاط مطلوب"],
      enum: ["restaurant", "home_kitchen"],
      default: "restaurant",
    },
    cuisine: {
      type: String,
      required: [true, "المطبخ/الدولة مطلوب"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "صورة شهادة الصحة مطلوبة"],
    },
    location: {
      type: String,
      required: [true, "العنوان/المحافظة مطلوب"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "رقم الهاتف مطلوب"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApproveRestaurant", restaurantSchema);