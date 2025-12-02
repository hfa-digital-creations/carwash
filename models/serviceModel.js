import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    itemImage: { 
      type: String, 
      required: true 
    }, // 🖼️ URL or path of the service image

    itemName: { 
      type: String, 
      required: true 
    }, // 🧰 Example: "Car AC Repair Service"

    subTitle: { 
      type: String 
    }, // 📝 Example: "Cooling solutions for cars"

    description: { 
      type: String, 
      required: true 
    }, // 📄 Example: "Our car AC repair service ensures..."

    minPrice: { 
      type: Number, 
      required: true 
    }, // 💰 Minimum service charge (e.g., 500)

    maxPrice: { 
      type: Number, 
      required: true 
    }, // 💰 Maximum service charge (e.g., 2000)
     repairTechnicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RepairTechnician",
      required: true,
    },
  },
  { timestamps: true }
);

const Service = mongoose.model("Service", serviceSchema);

export default Service;
