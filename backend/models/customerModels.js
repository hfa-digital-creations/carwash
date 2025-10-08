import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  { timestamps: true }
);

const Customer = mongoose.model("User", customerSchema);
export default Customer;
//mongodb+srv://ashekm2003_db_user:ashekm@cluster0.3kepwpp.mongodb.net/CarWash?retryWrites=true&w=majority&appName=Cluster0