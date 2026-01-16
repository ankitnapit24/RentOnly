const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");
require("dotenv").config();

const Room = require("./models/Room");
const Enquiry = require("./models/Enquiry");

const app = express();
const port = process.env.PORT || 5000;

/* ================= CORS - ALLOW FRONTEND ================= */
app.use(cors({
  origin: [
    "http://localhost:5173", // Local development
    "https://your-frontend.vercel.app", // Replace with your actual Vercel URL
    "https://your-frontend.netlify.app" // Or Netlify URL
  ],
  credentials: true
}));

app.use(express.json());

/* ================= CLOUDINARY CONFIG ================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ================= MULTER + CLOUDINARY STORAGE ================= */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "rental_rooms",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage: storage });

/* ================= MONGODB ================= */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ================= API ROUTES ================= */

/* ================= TEST ================= */
app.get("/api/test", (req, res) => {
  res.send("Backend API running 🚀");
});

/* ================= ADMIN LOGIN ================= */
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

/* ================= GET APPROVED ROOMS ================= */
app.get("/rooms", async (req, res) => {
  try {
    const { location, minPrice, maxPrice } = req.query;
    let query = { status: "APPROVED" };

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const rooms = await Room.find(query).sort({ created_at: -1 });
    // Transform to include id field for frontend compatibility
    const transformedRooms = rooms.map(r => ({
      ...r.toObject(),
      id: r._id
    }));
    res.json(transformedRooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADD ROOM (WITH CLOUDINARY) ================= */
app.post("/rooms", upload.array("images", 5), async (req, res) => {
  try {
    const { title, location, price, room_type } = req.body;

    if (!title || !location || !price || !room_type) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one image required" });
    }

    const imageUrls = req.files.map((file) => file.path);
    const firstImage = imageUrls[0];

    const newRoom = new Room({
      title,
      location,
      price: Number(price),
      room_type,
      image_url: firstImage,
      images: imageUrls,
      status: "PENDING"
    });

    await newRoom.save();
    res.json({ success: true, message: "Room submitted ⏳" });
  } catch (err) {
    console.error("❌ Room add error:", err);
    res.status(500).json({ error: "Failed to add room" });
  }
});

/* ================= ADMIN PENDING ================= */
app.get("/admin/rooms", async (req, res) => {
  try {
    const rooms = await Room.find({ status: "PENDING" }).sort({ created_at: -1 });
    const transformedRooms = rooms.map(r => ({
      ...r.toObject(),
      id: r._id
    }));
    res.json(transformedRooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= ADMIN ACTIONS ================= */
app.put("/admin/rooms/:id/approve", async (req, res) => {
  try {
    await Room.findByIdAndUpdate(req.params.id, { status: "APPROVED" });
    res.json({ message: "Approved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/admin/rooms/:id/reject", async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: "Rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/admin/rooms/:id", async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= ENQUIRIES ================= */
app.post("/enquiry", async (req, res) => {
  try {
    const { room_id, name, phone } = req.body;
    const newEnquiry = new Enquiry({ room_id, name, phone });
    await newEnquiry.save();
    res.json({ message: "Saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/admin/enquiries", async (req, res) => {
  try {
    const enquiries = await Enquiry.find().populate("room_id", "title").sort({ created_at: -1 });
    // Transform to match old MySQL structure if needed by frontend
    const transformedEnquiries = enquiries.map(e => ({
      ...e.toObject(),
      id: e._id,
      room_title: e.room_id ? e.room_id.title : "Deleted Room",
      room_id: e.room_id ? e.room_id._id : null
    }));
    res.json(transformedEnquiries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const fs = require("fs");
/* ================= SERVE FRONTEND ================= */
const frontendPath = path.join(__dirname, "frontend", "dist");

// Log for debugging on Render
console.log("Serving frontend from:", frontendPath);

app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  const indexPath = path.join(frontendPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Frontend build not found. Please run 'npm run build' first.");
  }
});

/* ================= START ================= */
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));

