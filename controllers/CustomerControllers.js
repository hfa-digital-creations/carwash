import Customer from "../models/customerModels.js";
import Address from "../models/createAddressModels.js";
import bcrypt from "bcryptjs";

// -------------------- Register User --------------------

const registerUser = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, password, confirmPassword } = req.body;

    if (!fullName || !email || !phoneNumber || !password || !confirmPassword)
      return res.status(400).json({ message: "All fields are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existingEmail = await Customer.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    const existingPhone = await Customer.findOne({ phoneNumber });
    if (existingPhone) return res.status(400).json({ message: "Phone number already exists" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    const newUser = new Customer({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      password: hashedPassword, // store hashed password
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully ✅", user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// -------------------- Login User --------------------


const loginUser = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password)
      return res.status(400).json({ message: "Email/Phone and password are required" });

    const user = await Customer.findOne({
      $or: [{ email: emailOrPhone.toLowerCase() }, { phoneNumber: emailOrPhone }],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect)
      return res.status(400).json({ message: "Incorrect password" }); // <-- this shows if password is wrong

    res.status(200).json({ message: "Login successful ✅", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// -------------------- Get All Users --------------------
const getAllUsers = async (req, res) => {
  try {
    const users = await Customer.find();
    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Get User By ID --------------------
const getUserById = async (req, res) => {
  try {
    const user = await Customer.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- Update User --------------------
const updateProfile = async (req, res) => {
  try {
    const userId = req.params.id; // get from path
    const { fullName, email, phoneNumber, street, city, pincode, maxCars, location } = req.body;

    // 0️⃣ Check for duplicate email ONLY
    if (email) {
      const existingEmailUser = await Customer.findOne({
        email: email.toLowerCase(),
        _id: { $ne: userId }, // exclude current user
      });
      if (existingEmailUser) {
        return res.status(400).json({ message: "Email already in use by another user" });
      }
    }

    // 1️⃣ Update Customer info
    const user = await Customer.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.fullName = fullName ?? user.fullName;
    if (email) user.email = email.toLowerCase();
    user.phoneNumber = phoneNumber ?? user.phoneNumber; // no duplicate check, just update
    await user.save();

    // 2️⃣ Update or Create Address
    let address = await Address.findOne({ userId });
    if (address) {
      address.street = street ?? address.street;
      address.city = city ?? address.city;
      address.pincode = pincode ?? address.pincode;
      address.maxCars = maxCars ?? address.maxCars;
      address.location = location ?? address.location;
      await address.save();
    } else {
      address = await Address.create({
        userId,
        street,
        city,
        pincode,
        maxCars,
        location,
      });
    }

    res.status(200).json({ message: "Profile updated successfully", user, address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};





// -------------------- Delete User --------------------
const deleteUser = async (req, res) => {
  try {
    const user = await Customer.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully ✅" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  updateProfile,
  deleteUser,
};
