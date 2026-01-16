const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  room_type: { type: String, required: true },
  image_url: { type: String }, // Primary image
  images: [{ type: String }], // All images
  status: { type: String, enum: ["PENDING", "APPROVED"], default: "PENDING" },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);
