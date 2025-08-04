require("dotenv").config(); // Load .env variables

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary + Multer Setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "x-marketplace",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});
const upload = multer({ storage });

// Mongoose Schema
const itemSchema = new mongoose.Schema({
  title: String,
  price: String,
  contact: String,
  category: String,
  images: [String],
  timestamp: Number,
  apronSize: String,
  apronColor: String,
});

const Item = mongoose.model("Item", itemSchema);

// GET: Fetch all items
app.get("/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ timestamp: -1 });
    res.json(items);
  } catch (err) {
    console.error("❌ Error fetching items:", err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// POST: Upload item with multiple images
app.post("/items", upload.array("images", 5), async (req, res) => {
  try {
    const { title, price, contact, category, timestamp, apronSize, apronColor } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }

    const imageUrls = req.files.map(file => file.path);

    const newItem = new Item({
      title,
      price,
      contact,
      category,
      images: imageUrls,
      timestamp: timestamp || Date.now(),
      apronSize: category === "Aprons" ? apronSize : undefined,
      apronColor: category === "Aprons" ? apronColor : undefined,
    });

    await newItem.save();
    res.status(201).json({ message: "Item saved", item: newItem });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});