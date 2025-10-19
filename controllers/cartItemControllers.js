import Cart from "../models/cartItemModels.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";

// Add a product to cart
const addProductToCart = async (req, res) => {
  try {
    const { customerId, productId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(customerId))
      return res.status(400).json({ message: "Invalid customerId" });
    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({ message: "Invalid productId" });

    // Fetch product details from DB
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Prepare cart item with full product details
    const productItem = {
      product: {
        _id: product._id,
        productTitle: product.productTitle,
        productDescription: product.productDescription,
        productImage: product.productImage,
        unitPrice: product.unitPrice,
        stockQuantity: product.stockQuantity,
        sellerId: product.sellerId,
      },
      quantity,
      total: product.unitPrice * quantity,
    };

    // Check if customer already has a cart
    let cart = await Cart.findOne({ customerId });

    if (!cart) {
      // If no cart exists, create a new cart
      cart = new Cart({ customerId, items: [productItem] });
    } else {
      // Check if product already exists in cart
      const existingIndex = cart.items.findIndex(
        (item) => item.product && item.product._id.toString() === productId
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += quantity;
        cart.items[existingIndex].total += product.unitPrice * quantity;
      } else {
        cart.items.push(productItem);
      }
    }

    await cart.save();
    res.status(201).json({ message: "Product added to cart", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// Add a service to cart
const addServiceToCart = async (req, res) => {
  try {
    const { customerId, serviceItems } = req.body;

    if (!mongoose.Types.ObjectId.isValid(customerId))
      return res.status(400).json({ message: "Invalid customerId" });

    let cart = await Cart.findOne({ customerId });

    const serviceCartItem = {
      serviceItems,
      quantity: 1,
      total: serviceItems.reduce((sum, s) => sum + s.serviceCharges, 0),
    };

    if (cart) {
      cart.items.push(serviceCartItem);
    } else {
      cart = new Cart({
        customerId,
        items: [serviceCartItem],
      });
    }

    await cart.save();
    res.status(201).json({ message: "Service added to cart", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all carts (admin purpose)
const getAllCarts = async (req, res) => {
  try {
    const carts = await Cart.find().populate("customerId", "name email");
    res.json({ carts });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get cart by customerId
const getCartByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId))
      return res.status(400).json({ message: "Invalid customerId" });

    const cart = await Cart.findOne({ customerId }).populate(
      "customerId",
      "name email"
    );

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    res.json({ cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Remove an item from cart
const removeItemFromCart = async (req, res) => {
  try {
    const { customerId, itemId, type } = req.body;

    if (!mongoose.Types.ObjectId.isValid(customerId))
      return res.status(400).json({ message: "Invalid customerId" });

    let cart = await Cart.findOne({ customerId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    if (type === "product") {
      cart.items = cart.items.filter(
        (item) => item.product?._id.toString() !== itemId
      );
    } else if (type === "service") {
      cart.items = cart.items.filter(
        (item) =>
          !item.serviceItems.some((s) => s.serviceId.toString() === itemId)
      );
    }

    await cart.save();
    res.json({ message: "Item removed from cart", cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Clear cart for a customer
const clearCart = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId))
      return res.status(400).json({ message: "Invalid customerId" });

    const cart = await Cart.findOneAndUpdate(
      { customerId },
      { items: [], subtotal: 0 },
      { new: true }
    );

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    res.json({ message: "Cart cleared", cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export default {
  addProductToCart,
  addServiceToCart,
  getAllCarts,
  getCartByCustomerId,
  removeItemFromCart,
  clearCart,
};
