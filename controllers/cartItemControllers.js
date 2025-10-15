import Cart from "../models/cartItemModels.js";
import mongoose from "mongoose";

// Add a product to cart
const addProductToCart = async (req, res) => {
  try {
    const { customerId, productId, productName, productDescription, quantity, price } = req.body;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customerId" });
    }

    let cart = await Cart.findOne({ customerId });
    const total = quantity * price;

    const productItem = { productId, productName, productDescription, quantity, price, total };

    if (cart) {
      // Check if product already exists
      const existingIndex = cart.items.findIndex(
        (item) => item.productId?.toString() === productId
      );
      if (existingIndex > -1) {
        // Update quantity & total
        cart.items[existingIndex].quantity += quantity;
        cart.items[existingIndex].total += total;
      } else {
        cart.items.push(productItem);
      }
    } else {
      cart = new Cart({ customerId, items: [productItem] });
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

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customerId" });
    }

    let cart = await Cart.findOne({ customerId });

    if (cart) {
      cart.items.push({ serviceItems });
    } else {
      cart = new Cart({ customerId, items: [{ serviceItems }] });
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
    const carts = await Cart.find()
      .populate("customerId", "name email")
      .populate("items.productId", "name price");
    res.json({ carts });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get cart by customerId
const getCartByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customerId" });
    }

    const cart = await Cart.findOne({ customerId })
      .populate("customerId", "name email")
      .populate("items.productId", "name price");

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    res.json({ cart });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Remove an item from cart (product or service)
const removeItemFromCart = async (req, res) => {
  try {
    const { customerId, itemId, type } = req.body; // type: "product" or "service"

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customerId" });
    }

    let cart = await Cart.findOne({ customerId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    if (type === "product") {
      cart.items = cart.items.filter((item) => item.productId?.toString() !== itemId);
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

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: "Invalid customerId" });
    }

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

