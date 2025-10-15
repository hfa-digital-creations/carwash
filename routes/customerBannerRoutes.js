import express from "express";
import customerBannerControllers from "../controllers/customerBannerControllers.js";
import { uploadBanner } from "../middlewares/multerConfig.js";

const router = express.Router();

// 🟢 Create Banner
router.post("/createCustomerBanner", uploadBanner.single("image"), customerBannerControllers.createBanner);

// 🟡 Get All Banners
router.get("/getallCustomerBanner", customerBannerControllers.getAllBanners);

// 🟣 Update Banner
router.put("/updateCustomerBanner/:id", uploadBanner.single("image"), customerBannerControllers.updateBanner);

// 🔴 Delete Banner
router.delete("/deleteCustomerBanner/:id", customerBannerControllers.deleteBanner);

export default router;
