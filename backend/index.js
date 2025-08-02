const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Mongoose Schema
const itemSchema = new mongoose.Schema({
  title: String,
  price: String,
  contact: String
});

const Item = mongoose.model("Item", itemSchema);

// Routes
app.get("/items", async (req, res) => {
  const items = await Item.find();
  res.json(items);
});

app.post("/items", async (req, res) => {
  const newItem = new Item(req.body);
  await newItem.save();
  res.json({ message: "Item saved", item: newItem });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});