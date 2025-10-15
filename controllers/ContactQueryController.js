import ContactQuery from "../models/contactQueryModel.js";

// ✅ Create a new contact query
 const createQuery = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, category, message } = req.body;

    // Validation
    if (!fullName || !email || !phoneNumber || !category || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newQuery = new ContactQuery({
      fullName,
      email,
      phoneNumber,
      category,
      message,
    });

    await newQuery.save();
    res.status(201).json({
      message: "Query submitted successfully!",
      data: newQuery,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get all contact queries
 const getAllQueries = async (req, res) => {
  try {
    const queries = await ContactQuery.find().sort({ createdAt: -1 });
    if (!queries.length) {
      return res.status(404).json({ message: "No contact queries found." });
    }
    res.status(200).json({ count: queries.length, data: queries });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get a single query by ID
 const getQueryById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = await ContactQuery.findById(id);

    if (!query) {
      return res.status(404).json({ message: "Query not found." });
    }

    res.status(200).json({ data: query });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default{
    createQuery,
    getAllQueries,
    getQueryById
}