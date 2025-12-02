import express from "express";
import productSellerController from "../controllers/ProductSellerController.js"
const router = express.Router();

// ✅ Create new Product Seller
router.post("/createProductSeller", productSellerController.createProductSeller);

// ✅ Get all Product Sellers
router.get("/getAllProductSellers", productSellerController.getAllProductSellers);

// ✅ Get Product Seller by ID
router.get("/getProductSellerById/:id", productSellerController.getProductSellerById);

// ✅ Update Product Seller (full update)
router.put("/updateProductSeller/:id", productSellerController.updateProductSeller);

// ✅ Delete Product Seller
router.delete("/deleteProductSeller/:id", productSellerController.deleteProductSeller);

export default router;
