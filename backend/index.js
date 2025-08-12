const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcrypt"); // 👈 New import for bcrypt

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Enhanced MongoDB Schema with new fields and delete key hash
const itemSchema = new mongoose.Schema({
  title: String,
  price: String,
  contact: String,
  category: String,
  categoryDescription: String,
  images: [String],
  timestamp: Number,
  apronSize: String,
  apronColor: String,
  deleteKeyHash: String // 👈 New field for the hashed delete key
});

const Item = mongoose.model("Item", itemSchema);

// GET all items
app.get("/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ timestamp: -1 });
    res.json(items);
  } catch (error) {
    console.error("❌ Get items error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST item with multiple images and enhanced fields
app.post("/items", upload.array("images", 5), async (req, res) => {
  try {
    const { 
      title, 
      price, 
      contact, 
      category, 
      categoryDescription, 
      timestamp, 
      apronSize, 
      apronColor,
      deleteKey // 👈 Get the delete key from the request body
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }

    if (!deleteKey) {
      return res.status(400).json({ error: "Delete key is required" });
    }
    
    // Hash the delete key before saving
    const saltRounds = 10;
    const deleteKeyHash = await bcrypt.hash(deleteKey, saltRounds);

    const imageUrls = req.files.map(file => file.path);

    const newItem = new Item({
      title,
      price,
      contact,
      category,
      categoryDescription: categoryDescription || undefined,
      images: imageUrls,
      timestamp: timestamp || Date.now(),
      apronSize: category === "Aprons" ? apronSize : undefined,
      apronColor: category === "Aprons" ? apronColor : undefined,
      deleteKeyHash // 👈 Store the hashed key in the database
    });

    await newItem.save();
    res.status(201).json({ message: "Item saved", item: newItem });

  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE item by ID
app.delete("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteKey } = req.body; // 👈 Get the delete key from the request body

    const item = await Item.findById(id);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    // New: Master Key Check
    const masterKey = "Sai@1235";
    if (deleteKey === masterKey) {
      await Item.findByIdAndDelete(id);
      return res.status(200).json({ message: "Item deleted successfully with master key" });
    }

    // Original: Compare the provided key with the stored hash
    const isMatch = await bcrypt.compare(deleteKey, item.deleteKeyHash);

    if (isMatch) {
      await Item.findByIdAndDelete(id);
      return res.status(200).json({ message: "Item deleted successfully" });
    } else {
      return res.status(401).json({ error: "Incorrect delete key" });
    }
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
