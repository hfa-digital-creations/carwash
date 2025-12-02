import mongoose from "mongoose";
import Product from "../models/productModel.js";
import ProductSeller from "../models/productSellerModels.js";

// 📦 Create Product
const createProduct = async (req, res) => {
    try {
        const { productTitle, productDescription, unitPrice, stockQuantity, sellerId } = req.body;
        const productImage = req.file ? req.file.path : req.body.productImage;

        if (!productTitle || !productDescription || !unitPrice || !stockQuantity || !productImage || !sellerId) {
            return res.status(400).json({ message: "All fields are required including sellerId" });
        }

        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({ message: "Invalid sellerId" });
        }

        const seller = await ProductSeller.findById(sellerId);
        if (!seller) return res.status(404).json({ message: "Seller not found" });

        // 1️⃣ Create product with sellerId
        const newProduct = new Product({
            productTitle,
            productDescription,
            unitPrice,
            stockQuantity,
            productImage,
            sellerId
        });
        await newProduct.save();

        // 2️⃣ Add full product document to seller's products array
        seller.products.push({
            _id: newProduct._id,
            productTitle: newProduct.productTitle,
            productDescription: newProduct.productDescription,
            unitPrice: newProduct.unitPrice,
            stockQuantity: newProduct.stockQuantity,
            productImage: newProduct.productImage,
            createdAt: newProduct.createdAt,
            updatedAt: newProduct.updatedAt
        });
        await seller.save();

        // Optional: populate products for response
        await seller.populate("products");

        res.status(201).json({ message: "Product created successfully", seller });
    } catch (error) {
        console.error("Create Product Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// 🧾 Get All Products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json({ count: products.length, products });
    } catch (error) {
        console.error("Get All Products Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// 🔍 Get Product by ID
const getProductById = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);

        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json(product);
    } catch (error) {
        console.error("Get Product By ID Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ✅ Get all products for a specific seller
const getAllProductsBySellerId = async (req, res) => {
    try {
        const { sellerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({ message: "Invalid Seller ID" });
        }

        // Fetch seller and populate products
        const seller = await ProductSeller.findById(sellerId).populate("products");
        if (!seller) return res.status(404).json({ message: "Seller not found" });

        res.status(200).json({
            message: `All products for seller ${seller.fullName}`,
            count: seller.products.length,
            products: seller.products
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ✏️ Update Product
const updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { productTitle, productDescription, unitPrice, stockQuantity } = req.body;
        const productImage = req.file ? req.file.path : req.body.productImage;

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            { productTitle, productDescription, unitPrice, stockQuantity, productImage },
            { new: true }
        );

        if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

        res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// 🗑️ Delete Product
const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (!deletedProduct) return res.status(404).json({ message: "Product not found" });

        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Delete Product Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export default {
    createProduct,
    getAllProducts,
    getProductById,
    getAllProductsBySellerId,
    updateProduct,
    deleteProduct,
};
