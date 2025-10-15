import HomeBanner from "../models/CustomerHomeBannerModel.js";
import { uploadBanner } from "../middlewares/multerConfig.js";

// 🟢 Create Banner
const createBanner = async (req, res) => {
  try {
    const bannerData = { ...req.body };
    if (req.file) {
      bannerData.image = req.file.path; // save the uploaded file path
    }

    const banner = await HomeBanner.create(bannerData);
    res.status(201).json({ message: "Banner created successfully", banner });
  } catch (error) {
    res.status(500).json({ message: "Error creating banner", error: error.message });
  }
};

// 🟡 Get All Banners
 const getAllBanners = async (req, res) => {
  try {
    const banners = await HomeBanner.find();
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: "Error fetching banners", error: error.message });
  }
};

// 🟣 Update Banner
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = req.file.path; // replace with new image if uploaded
    }

    const updatedBanner = await HomeBanner.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedBanner) return res.status(404).json({ message: "Banner not found" });

    res.status(200).json({ message: "Banner updated successfully", updatedBanner });
  } catch (error) {
    res.status(500).json({ message: "Error updating banner", error: error.message });
  }
};

// 🔴 Delete Banner
 const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBanner = await HomeBanner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting banner", error: error.message });
  }
};

// 🟢 Default 
export default {
  createBanner,
  getAllBanners,
  updateBanner,
  deleteBanner,
};
