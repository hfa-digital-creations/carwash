    import mongoose from "mongoose";

    const washServiceSchema = new mongoose.Schema(
    {
        packageName: {
        type: String,
        required: true, // e.g., "Basic Wash", "Standard Wash"
        trim: true,
        },
        price: {
        type: Number,
        required: true, // numeric price e.g., 15
        min: 0,
        },
        description: {
        type: String,
        required: true, // short description of the package
        trim: true,
        },
        features: {
        type: [String], // list of features for the package
        required: true,
        },
        //  currency: {
        //   type: String,
        //   default: "₹",
        // },
        // isActive: {
        //   type: Boolean,
        //   default: true,
        // },
    },
    { timestamps: true }
    );

    export default mongoose.model("WashService", washServiceSchema);
