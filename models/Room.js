const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  area_location: { type: String, required: true }, // Dropdown location (e.g., "Ashoka Garden")
  exact_location: { type: String, required: true }, // Full address
  price: { type: Number, required: true },
  room_type: { type: String, required: true },
  owner_phone: { type: String, required: true }, // Owner's phone number
  image_url: { type: String }, // Primary image
  images: [{ type: String }], // All images
  status: { type: String, enum: ["PENDING", "APPROVED"], default: "PENDING" },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);
