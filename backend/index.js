const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcrypt");
const path = require("path"); // Import the path module

const app = express();
const PORT = 3000;

// Configure CORS
const allowedOrigins = ["https://x-marketplace-one.vercel.app", "http://localhost:3000", "http://127.0.0.1:5501"];
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
app.use(express.static('public')); // Serve static files from 'public'

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

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "x-marketplace", allowed_formats: ["jpg", "png", "jpeg"] },
});
const upload = multer({ storage });

// --- Schemas ---
const itemSchema = new mongoose.Schema({ /* ... existing schema ... */ });
const Item = mongoose.model("Item", itemSchema);
const reportSchema = new mongoose.Schema({ /* ... existing schema ... */ });
const Report = mongoose.model("Report", reportSchema);

// --- Master Key Logic ---
const MASTER_KEY = "ramatej@1357";

const masterKeyAuth = (req, res, next) => {
    const providedKey = req.headers['x-master-key'];
    if (providedKey === MASTER_KEY) {
        next();
    } else {
        res.status(401).json({ error: "Unauthorized: Invalid master key" });
    }
};

// --- Admin Routes ---
app.post("/admin/login", (req, res) => {
    const { masterKey } = req.body;
    if (masterKey === MASTER_KEY) {
        res.status(200).json({ success: true, message: "Login successful" });
    } else {
        res.status(401).json({ success: false, message: "Invalid master key" });
    }
});

// New: Securely serve the admin.js file
app.get('/admin/admin.js', masterKeyAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'private_assets', 'admin.js'));
});


// --- Item Routes ---
app.get("/items", async (req, res) => { /* ... existing code ... */ });
app.post("/items", upload.array("images", 5), async (req, res) => { /* ... existing code ... */ });
app.delete("/items/:id", async (req, res) => { /* ... existing code ... */ });
app.put("/items/:id", masterKeyAuth, async (req, res) => { /* ... existing code ... */ });

// --- Report Routes ---
app.post("/report-item", async (req, res) => { /* ... existing code ... */ });
app.post("/report-issue", async (req, res) => { /* ... existing code ... */ });
app.get("/reports", masterKeyAuth, async (req, res) => { /* ... existing code ... */ });

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
