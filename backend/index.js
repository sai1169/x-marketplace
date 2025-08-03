const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Set up Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "x-marketplace",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

// Define Mongoose schema
const itemSchema = new mongoose.Schema({
  title: String,
  price: String,
  contact: String,
  category: String,
  imageUrl: String,
});

const Item = mongoose.model("Item", itemSchema);

// GET all items
app.get("/items", async (req, res) => {
  const items = await Item.find();
  res.json(items);
});

// POST a new item with image
app.post("/items", upload.single("image"), async (req, res) => {
  const { title, price, contact, category } = req.body;
  const imageUrl = req.file.path;

  const newItem = new Item({ title, price, contact, category, imageUrl });
  await newItem.save();

  res.json({ message: "Item saved", item: newItem });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});