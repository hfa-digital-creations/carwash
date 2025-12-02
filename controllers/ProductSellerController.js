import ProductSeller from "../models/productSellerModels.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";


// Create a new Product Seller along with products
const createProductSeller = async (req, res) => {
  try {
    const { products, ...sellerData } = req.body; // separate products from seller data

    // 1️⃣ First create the seller (without products)
    const seller = new ProductSeller({ ...sellerData });
    await seller.save();

    let productIds = [];

    if (products && Array.isArray(products) && products.length > 0) {
      // 2️⃣ Create products in Product collection with sellerId
      const createdProducts = await Product.insertMany(
        products.map((p) => ({
          productTitle: p.productTitle,
          productDescription: p.productDescription,
          unitPrice: p.unitPrice,
          stockQuantity: p.stockQuantity,
          productImage: p.productImage,
          sellerId: seller._id, // add sellerId to each product
        }))
      );

      productIds = createdProducts.map((p) => p._id);

      // 3️⃣ Add full product details to seller.products
      seller.products = createdProducts; // embed full product documents
      await seller.save();
    }

    res.status(201).json({ message: "Product Seller created successfully", data: seller });
  } catch (error) {
    res.status(400).json({ message: "Error creating Product Seller", error: error.message });
  }
};

// ✅ Get all Product Sellers
const getAllProductSellers = async (req, res) => {
  try {
    const sellers = await ProductSeller.find()
      .sort({ createdAt: -1 })
      .populate("products"); // populate products
    res.status(200).json({ message: "All Product Sellers fetched successfully", data: sellers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching Product Sellers", error: error.message });
  }
};

// ✅ Get Product Seller by ID
const getProductSellerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID" });

    const seller = await ProductSeller.findById(id).populate("products");
    if (!seller) return res.status(404).json({ message: "Product Seller not found" });

    res.status(200).json({ message: "Product Seller fetched successfully", data: seller });
  } catch (error) {
    res.status(500).json({ message: "Error fetching Product Seller", error: error.message });
  }
};
// ✅ Update Product Seller (full update)
const updateProductSeller = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const updatedSeller = await ProductSeller.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedSeller) return res.status(404).json({ message: "Product Seller not found" });

    res.status(200).json({ message: "Product Seller updated successfully", data: updatedSeller });
  } catch (error) {
    res.status(400).json({ message: "Error updating Product Seller", error: error.message });
  }
};

// ✅ Delete Product Seller
const deleteProductSeller = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const deletedSeller = await ProductSeller.findByIdAndDelete(id);
    if (!deletedSeller) return res.status(404).json({ message: "Product Seller not found" });

    res.status(200).json({ message: "Product Seller deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Product Seller", error: error.message });
  }
};

// ✅ Export all controllers
export default {
  createProductSeller,
  getAllProductSellers,
  getProductSellerById,
  updateProductSeller,
  deleteProductSeller,
};
