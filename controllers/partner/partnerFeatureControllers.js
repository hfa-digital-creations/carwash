import Partner from "../../models/partnerModel.js";
import { Transaction, EarningsSummary } from "../../models/earningsModel.js";
import Notification from "../../models/notificationModel.js";
import mongoose from "mongoose";

// ==================== PROFILE MANAGEMENT ====================

// Get Partner Profile
const getPartnerProfile = async (req, res) => {
  try {
    const partnerId = req.partner._id; // From middleware

    const partner = await Partner.findById(partnerId).select("-password");
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.status(200).json({
      message: "Profile fetched successfully",
      partner
    });

  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Partner Profile (Common fields for all roles)
const updatePartnerProfile = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const {
      fullName,
      email,
      phoneNumber,
      dateOfBirth,
      gender,
      profilePhoto,
      address,
      emergencyContact
    } = req.body;

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Check email uniqueness if changing
    if (email && email !== partner.email) {
      const existingEmail = await Partner.findOne({
        email: email.toLowerCase(),
        _id: { $ne: partnerId }
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      partner.email = email.toLowerCase();
    }

    // Check phone uniqueness if changing
    if (phoneNumber && phoneNumber !== partner.phoneNumber) {
      const existingPhone = await Partner.findOne({
        phoneNumber,
        _id: { $ne: partnerId }
      });
      if (existingPhone) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
      partner.phoneNumber = phoneNumber;
    }

    // Update common fields
    if (fullName) partner.fullName = fullName;
    if (dateOfBirth) partner.dateOfBirth = dateOfBirth;
    if (gender) partner.gender = gender;
    if (profilePhoto) partner.profilePhoto = profilePhoto;
    if (address) partner.address = address;
    if (emergencyContact) partner.emergencyContact = emergencyContact;

    await partner.save();

    console.log(`✅ Profile updated: ${partner.email}`);

    res.status(200).json({
      message: "Profile updated successfully",
      partner: partner.toObject({ versionKey: false, password: false })
    });

  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== WASHING PERSONNEL / DELIVERY PERSON ====================

// Update Vehicle Details
const updateVehicleDetails = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { vehicleType, vehicleModel, licensePlate, registrationCertificate, drivingLicense } = req.body;

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (partner.role !== "Washing Personnel" && partner.role !== "Delivery Person") {
      return res.status(400).json({ message: "Vehicle details only for Washing Personnel or Delivery Person" });
    }

    if (!partner.vehicleDetails) {
      partner.vehicleDetails = {};
    }

    if (vehicleType) partner.vehicleDetails.vehicleType = vehicleType;
    if (vehicleModel) partner.vehicleDetails.vehicleModel = vehicleModel;
    if (licensePlate) partner.vehicleDetails.licensePlate = licensePlate;
    if (registrationCertificate) partner.vehicleDetails.registrationCertificate = registrationCertificate;
    if (drivingLicense) partner.vehicleDetails.drivingLicense = drivingLicense;

    await partner.save();

    res.status(200).json({
      message: "Vehicle details updated successfully",
      vehicleDetails: partner.vehicleDetails
    });

  } catch (error) {
    console.error("❌ Update vehicle error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Availability (for Washing Personnel/Delivery Person)
const updateAvailability = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({ message: "isAvailable must be boolean" });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // You can add availability field to partner model or use isActive
    partner.isActive = isAvailable;
    await partner.save();

    res.status(200).json({
      message: `Availability updated to ${isAvailable ? "Available" : "Unavailable"}`,
      isAvailable: partner.isActive
    });

  } catch (error) {
    console.error("❌ Update availability error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== REPAIR SERVICE TECHNICIAN ====================

// Add New Service (Repair Technician)
const addService = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { serviceImage, serviceName, description, minPrice, maxPrice } = req.body;

    if (!serviceName || !minPrice || !maxPrice) {
      return res.status(400).json({ message: "Service name and prices are required" });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (partner.role !== "Repair Service Technician") {
      return res.status(400).json({ message: "Only Repair Service Technicians can add services" });
    }

    // Add new service
    partner.services.push({
      serviceImage,
      serviceName,
      description,
      minPrice,
      maxPrice
    });

    await partner.save();

    console.log(`✅ New service added: ${serviceName} by ${partner.fullName}`);

    res.status(201).json({
      message: "Service added successfully",
      services: partner.services
    });

  } catch (error) {
    console.error("❌ Add service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Service (Repair Technician)
const updateService = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { serviceId } = req.params;
    const { serviceImage, serviceName, description, minPrice, maxPrice } = req.body;

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (partner.role !== "Repair Service Technician") {
      return res.status(400).json({ message: "Only Repair Service Technicians can update services" });
    }

    // Find service by _id
    const service = partner.services.id(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Update fields
    if (serviceImage !== undefined) service.serviceImage = serviceImage;
    if (serviceName) service.serviceName = serviceName;
    if (description !== undefined) service.description = description;
    if (minPrice !== undefined) service.minPrice = minPrice;
    if (maxPrice !== undefined) service.maxPrice = maxPrice;

    await partner.save();

    res.status(200).json({
      message: "Service updated successfully",
      service
    });

  } catch (error) {
    console.error("❌ Update service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Service (Repair Technician)
const deleteService = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { serviceId } = req.params;

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (partner.role !== "Repair Service Technician") {
      return res.status(400).json({ message: "Only Repair Service Technicians can delete services" });
    }

    // Remove service
    partner.services.pull(serviceId);
    await partner.save();

    res.status(200).json({
      message: "Service deleted successfully",
      services: partner.services
    });

  } catch (error) {
    console.error("❌ Delete service error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get My Services (Repair Technician)
const getMyServices = async (req, res) => {
  try {
    const partnerId = req.partner._id;

    const partner = await Partner.findById(partnerId).select("services");
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.status(200).json({
      message: "Services fetched successfully",
      services: partner.services,
      count: partner.services.length
    });

  } catch (error) {
    console.error("❌ Get services error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Shop Details (Repair Technician)
const updateShopDetails = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { shopName, shopType, shopAddress, location, shopImages } = req.body;

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (partner.role !== "Repair Service Technician" && partner.role !== "Product Seller") {
      return res.status(400).json({ message: "Only Repair Technicians and Product Sellers can update shop details" });
    }

    if (!partner.shopDetails) {
      partner.shopDetails = {};
    }

    if (shopName) partner.shopDetails.shopName = shopName;
    if (shopType) partner.shopDetails.shopType = shopType;
    if (shopAddress) partner.shopDetails.shopAddress = shopAddress;
    if (location) partner.shopDetails.location = location;
    if (shopImages) partner.shopDetails.shopImages = shopImages;

    await partner.save();

    res.status(200).json({
      message: "Shop details updated successfully",
      shopDetails: partner.shopDetails
    });

  } catch (error) {
    console.error("❌ Update shop error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== PRODUCT SELLER ====================

// Add New Product (Product Seller)
const addProduct = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { productImage, productTitle, productDescription, unitPrice, stockQuantity } = req.body;

    if (!productTitle || !unitPrice || !stockQuantity) {
      return res.status(400).json({ message: "Product title, price, and quantity are required" });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (partner.role !== "Product Seller") {
      return res.status(400).json({ message: "Only Product Sellers can add products" });
    }

    // Add new product
    partner.products.push({
      productImage,
      productTitle,
      productDescription,
      unitPrice,
      stockQuantity
    });

    await partner.save();

    console.log(`✅ New product added: ${productTitle} by ${partner.fullName}`);

    res.status(201).json({
      message: "Product added successfully",
      products: partner.products
    });

  } catch (error) {
    console.error("❌ Add product error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Product (Product Seller)
const updateProduct = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { productId } = req.params;
    const { productImage, productTitle, productDescription, unitPrice, stockQuantity } = req.body;

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (partner.role !== "Product Seller") {
      return res.status(400).json({ message: "Only Product Sellers can update products" });
    }

    // Find product by _id
    const product = partner.products.id(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update fields
    if (productImage !== undefined) product.productImage = productImage;
    if (productTitle) product.productTitle = productTitle;
    if (productDescription !== undefined) product.productDescription = productDescription;
    if (unitPrice !== undefined) product.unitPrice = unitPrice;
    if (stockQuantity !== undefined) product.stockQuantity = stockQuantity;

    await partner.save();

    res.status(200).json({
      message: "Product updated successfully",
      product
    });

  } catch (error) {
    console.error("❌ Update product error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Product (Product Seller)
const deleteProduct = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { productId } = req.params;

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (partner.role !== "Product Seller") {
      return res.status(400).json({ message: "Only Product Sellers can delete products" });
    }

    // Remove product
    partner.products.pull(productId);
    await partner.save();

    res.status(200).json({
      message: "Product deleted successfully",
      products: partner.products
    });

  } catch (error) {
    console.error("❌ Delete product error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get My Products (Product Seller)
const getMyProducts = async (req, res) => {
  try {
    const partnerId = req.partner._id;

    const partner = await Partner.findById(partnerId).select("products shopDetails");
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    res.status(200).json({
      message: "Products fetched successfully",
      products: partner.products,
      shopDetails: partner.shopDetails,
      count: partner.products.length
    });

  } catch (error) {
    console.error("❌ Get products error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== EARNINGS ====================

// Get Earnings Summary
const getEarningsSummary = async (req, res) => {
  try {
    const partnerId = req.partner._id;

    let summary = await EarningsSummary.findOne({ partnerId });

    if (!summary) {
      summary = await EarningsSummary.create({ partnerId });
    }

    res.status(200).json({
      message: "Earnings summary fetched",
      summary
    });

  } catch (error) {
    console.error("❌ Get earnings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Transaction History
const getTransactionHistory = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { transactionType, page = 1, limit = 20 } = req.query;

    let filter = { partnerId };
    if (transactionType) filter.transactionType = transactionType;

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Transaction.countDocuments(filter);

    res.status(200).json({
      message: "Transaction history fetched",
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error("❌ Get transactions error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==================== PAYOUT DETAILS ====================

// Update Payout Details
const updatePayoutDetails = async (req, res) => {
  try {
    const partnerId = req.partner._id;
    const { accountHolderName, accountNumber, ifscCode, idProof, termsAccepted } = req.body;

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    if (!partner.payoutDetails) {
      partner.payoutDetails = {};
    }

    if (accountHolderName) partner.payoutDetails.accountHolderName = accountHolderName;
    if (accountNumber) partner.payoutDetails.accountNumber = accountNumber;
    if (ifscCode) partner.payoutDetails.ifscCode = ifscCode;
    if (idProof) partner.payoutDetails.idProof = idProof;
    if (termsAccepted !== undefined) partner.payoutDetails.termsAccepted = termsAccepted;

    await partner.save();

    res.status(200).json({
      message: "Payout details updated successfully",
      payoutDetails: partner.payoutDetails
    });

  } catch (error) {
    console.error("❌ Update payout error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  // Profile
  getPartnerProfile,
  updatePartnerProfile,
  
  // Washing Personnel / Delivery Person
  updateVehicleDetails,
  updateAvailability,
  
  // Repair Service Technician
  addService,
  updateService,
  deleteService,
  getMyServices,
  updateShopDetails,
  
  // Product Seller
  addProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  
  // Earnings
  getEarningsSummary,
  getTransactionHistory,
  
  // Payout
  updatePayoutDetails
};