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
    "http://localhost:5173",
    "https://your-frontend.vercel.app",
    "https://your-frontend.netlify.app"
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

/* ================= HELPER FUNCTION TO TRANSFORM ROOM DATA ================= */
const transformRoom = (room) => {
  const roomObj = room.toObject();
  return {
    id: roomObj._id.toString(),
    title: roomObj.title,
    location: roomObj.location,
    price: roomObj.price,
    room_type: roomObj.room_type,
    image_url: roomObj.image_url,
    images: Array.isArray(roomObj.images) ? roomObj.images : [],
    status: roomObj.status,
    created_at: roomObj.created_at
  };
};

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
    const transformedRooms = rooms.map(transformRoom);
    
    console.log(`✅ Fetched ${transformedRooms.length} approved rooms`);
    res.json(transformedRooms);
  } catch (err) {
    console.error("❌ Error fetching rooms:", err);
    res.status(500).json({ error: err.message, rooms: [] });
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
    console.log("✅ New room added:", newRoom._id);
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
    const transformedRooms = rooms.map(transformRoom);
    
    console.log(`✅ Fetched ${transformedRooms.length} pending rooms`);
    res.json(transformedRooms);
  } catch (err) {
    console.error("❌ Error fetching pending rooms:", err);
    res.status(500).json({ error: err.message, rooms: [] });
  }
});

/* ================= ADMIN ACTIONS ================= */
app.put("/admin/rooms/:id/approve", async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id, 
      { status: "APPROVED" },
      { new: true }
    );
    
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    
    console.log("✅ Room approved:", req.params.id);
    res.json({ message: "Approved", room: transformRoom(room) });
  } catch (err) {
    console.error("❌ Error approving room:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/admin/rooms/:id/reject", async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    
    console.log("✅ Room rejected:", req.params.id);
    res.json({ message: "Rejected" });
  } catch (err) {
    console.error("❌ Error rejecting room:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/admin/rooms/:id", async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    
    console.log("✅ Room deleted:", req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("❌ Error deleting room:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= ENQUIRIES ================= */
app.post("/enquiry", async (req, res) => {
  try {
    const { room_id, name, phone } = req.body;
    
    if (!room_id || !name || !phone) {
      return res.status(400).json({ error: "All fields required" });
    }
    
    const newEnquiry = new Enquiry({ room_id, name, phone });
    await newEnquiry.save();
    
    console.log("✅ Enquiry saved:", newEnquiry._id);
    res.json({ message: "Saved", success: true });
  } catch (err) {
    console.error("❌ Error saving enquiry:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/admin/enquiries", async (req, res) => {
  try {
    const enquiries = await Enquiry.find()
      .populate("room_id", "title")
      .sort({ created_at: -1 });
    
    const transformedEnquiries = enquiries.map(e => {
      const enquiryObj = e.toObject();
      return {
        id: enquiryObj._id.toString(),
        room_id: enquiryObj.room_id ? enquiryObj.room_id._id.toString() : null,
        room_title: enquiryObj.room_id ? enquiryObj.room_id.title : "Deleted Room",
        name: enquiryObj.name,
        phone: enquiryObj.phone,
        created_at: enquiryObj.created_at
      };
    });
    
    console.log(`✅ Fetched ${transformedEnquiries.length} enquiries`);
    res.json(transformedEnquiries);
  } catch (err) {
    console.error("❌ Error fetching enquiries:", err);
    res.status(500).json({ error: err.message, enquiries: [] });
  }
});

/* ================= SERVE FRONTEND ================= */
const frontendPath = path.join(__dirname, "frontend", "dist");

console.log("Serving frontend from:", frontendPath);

app.use(express.static(frontendPath));

app.get("/*", (req, res) => {
  const indexPath = path.join(frontendPath, "index.html");
  res.sendFile(indexPath);
});

/* ================= START ================= */
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
