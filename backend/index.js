const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;

// Configure CORS to only allow specific origins
const allowedOrigins = ["https://x-marketplace-one.vercel.app", "http://localhost:3000", "http://127.0.0.1:5501"]; // Added for local dev

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

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

// --- Schemas ---
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
  deleteKeyHash: String
});

const Item = mongoose.model("Item", itemSchema);

const reportSchema = new mongoose.Schema({
    message: { type: String, required: true },
    itemId: { type: String, required: false },
    timestamp: { type: Date, default: Date.now }
});

const Report = mongoose.model("Report", reportSchema);

// --- Master Key Logic ---
const MASTER_KEY = "ramatej@1357"; // Keep this secure, ideally as an environment variable

const masterKeyAuth = (req, res, next) => {
    const providedKey = req.headers['x-master-key'];
    if (providedKey === MASTER_KEY) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized: Invalid master key" });
    }
};

// --- Admin Login Route ---
app.post("/admin/login", (req, res) => {
    const { masterKey } = req.body;
    if (masterKey === MASTER_KEY) {
        res.status(200).json({ success: true, message: "Login successful" });
    } else {
        res.status(401).json({ success: false, message: "Invalid master key" });
    }
});


// --- Item Routes ---
app.get("/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ timestamp: -1 });
    res.json(items);
  } catch (error) {
    console.error("❌ Get items error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/items", upload.array("images", 5), async (req, res) => {
  try {
    const { 
      title, price, contact, category, categoryDescription, 
      timestamp, apronSize, apronColor, deleteKey
    } = req.body;

    if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No images uploaded" });
    if (!deleteKey) return res.status(400).json({ error: "Delete key is required" });
    
    const saltRounds = 10;
    const deleteKeyHash = await bcrypt.hash(deleteKey, saltRounds);
    const imageUrls = req.files.map(file => file.path);

    const newItem = new Item({
      title, price, contact, category, 
      categoryDescription: categoryDescription || undefined,
      images: imageUrls,
      timestamp: timestamp || Date.now(),
      apronSize: category === "Aprons" ? apronSize : undefined,
      apronColor: category === "Aprons" ? apronColor : undefined,
      deleteKeyHash
    });

    await newItem.save();
    res.status(201).json({ message: "Item saved", item: newItem });

  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteKey } = req.body;
    const item = await Item.findById(id);

    if (!item) return res.status(404).json({ error: "Item not found" });
    
    const getPublicIdFromUrl = (url) => {
      const match = url.match(/\/v\d+\/(.+?)\.[a-zA-Z0-9]+$/);
      return match ? match[1] : null;
    };
    
    let isMatch = (deleteKey === MASTER_KEY);
    if (!isMatch) {
      isMatch = await bcrypt.compare(deleteKey, item.deleteKeyHash);
    }

    if (isMatch) {
      for (const imageUrl of item.images) {
        const publicId = getPublicIdFromUrl(imageUrl);
        if (publicId) {
          try { await cloudinary.uploader.destroy(publicId); } 
          catch (cloudinaryError) { console.error(`❌ Cloudinary deletion failed for ${publicId}:`, cloudinaryError); }
        }
      }
      await Item.findByIdAndDelete(id);
      return res.status(200).json({ message: "Item deleted successfully" });
    } else {
      return res.status(401).json({ error: "Incorrect delete key" });
    }
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ error: "Incorrect delete key" });
  }
});

app.put("/items/:id", masterKeyAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, price, category } = req.body;

        const updatedItem = await Item.findByIdAndUpdate(id, {
            title,
            price,
            category
        }, { new: true });

        if (!updatedItem) {
            return res.status(404).json({ error: "Item not found" });
        }

        res.status(200).json({ message: "Item updated successfully", item: updatedItem });
    } catch (error) {
        console.error("❌ Update item error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// --- Report Routes ---
app.post("/report-item", async (req, res) => {
    try {
        const { itemId, message } = req.body;
        if (!itemId || !message) {
            return res.status(400).json({ error: "Item ID and message are required." });
        }
        const newReport = new Report({ itemId, message });
        await newReport.save();
        res.status(201).json({ message: "Item reported successfully." });
    } catch (error) {
        console.error("❌ Report item error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/report-issue", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required." });
        }
        const newReport = new Report({ message });
        await newReport.save();
        res.status(201).json({ message: "Issue reported successfully." });
    } catch (error) {
        console.error("❌ Report issue error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/reports", masterKeyAuth, async (req, res) => {
    try {
        const reports = await Report.find().sort({ timestamp: -1 });
        res.json(reports);
    } catch (error) {
        console.error("❌ Get reports error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
