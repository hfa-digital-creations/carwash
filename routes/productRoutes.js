import express from "express";
import productController from "../controllers/productController.js";
import { uploadProductImage } from "../middlewares/multerConfig.js";

const router = express.Router();

router.post("/createProduct", uploadProductImage.single("productImage"), productController.createProduct);
router.get("/getAllProducts", productController.getAllProducts);
router.get("/getProductById/:productId", productController.getProductById);
router.get("/getAllProductsBySellerId/:sellerId",productController.getAllProductsBySellerId);
router.put("/updateProduct/:productId", uploadProductImage.single("productImage"), productController.updateProduct);
router.delete("/deleteProduct/:productId", productController.deleteProduct);

export default router;
