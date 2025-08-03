const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const basicAuth = require('express-basic-auth');
require("dotenv").config();


app.use('/admin', basicAuth({
  users: { 'admin': process.env.ADMIN_PASSWORD },
  challenge: true,
}));

// Then define the route
app.get('/admin', (req, res) => {
  res.send('Welcome to the admin panel!');
});
const PORT = 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer + Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "x-marketplace",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

// MongoDB Schema (multiple images)
const itemSchema = new mongoose.Schema({
  title: String,
  price: String,
  contact: String,
  category: String,
  images: [String],
  timestamp: Number,
  apronSize: String,     // 👈 new
  apronColor: String     // 👈 new
});

const Item = mongoose.model("Item", itemSchema);

// GET all items
app.get("/items", async (req, res) => {
  const items = await Item.find().sort({ timestamp: -1 });
  res.json(items);
});

// POST item with multiple images
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
      apronColor: category === "Aprons" ? apronColor : undefined
    });

    await newItem.save();
    res.status(201).json({ message: "Item saved", item: newItem });

  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});


