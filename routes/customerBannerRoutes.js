import express from "express";
import customerBannerControllers from "../controllers/customerBannerControllers.js";

const router = express.Router();

// 🟢 Create Banner
router.post("/createCustomerBanner", customerBannerControllers.createBanner);

// 🟡 Get All Banners
router.get("/getallCustomerBanner", customerBannerControllers.getAllBanners);

// 🟣 Update Banner
router.put("/updateCustomerBanner/:id", customerBannerControllers.updateBanner);

// 🔴 Delete Banner
router.delete("/deleteCustomerBanner/:id", customerBannerControllers.deleteBanner);

export default router;
