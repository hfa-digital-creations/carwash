import HomeBanner from "../models/CustomerHomeBannerModel.js";

// 🟢 Create Banner
 const createBanner = async (req, res) => {
  try {
    const banner = await HomeBanner.create(req.body);
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
    const updatedBanner = await HomeBanner.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBanner) {
      return res.status(404).json({ message: "Banner not found" });
    }

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
