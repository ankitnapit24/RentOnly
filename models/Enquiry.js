const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema({
    room_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Room", 
        required: false,
        default: null 
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    is_general: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Enquiry", enquirySchema);
