import mongoose from "mongoose";

const homeBannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      enum: ["Car Wash", "Bike Wash"], // you can add more if needed
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priceTag: {
      type: Number,
      required: true, // example: "From $10"
    },
    image: {
      type: String, // optional banner image URL
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("HomeBanner", homeBannerSchema);
