const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema({
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Enquiry", enquirySchema);
