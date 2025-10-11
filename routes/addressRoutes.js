import express from "express";
import AddressController from "../controllers/addressController.js";

const router = express.Router();

// CREATE
router.post("/createAddress", AddressController.createAddress);

// GET all
router.get("/getAllAddress", AddressController.getAddresses);

// GET by ID
router.get("GetAddressById/:id", AddressController.getAddressById);

// UPDATE
router.put("updateAddress/:id", AddressController.updateAddress);

// DELETE
router.delete("deleteAddress/:id", AddressController.deleteAddress);

export default router;
