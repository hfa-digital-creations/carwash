
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Routes from "./routes/index.js"
import mongoose from "mongoose";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(Routes)
// Basic route

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("mongoDb connected"))
    .catch((err) => console.log(err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));