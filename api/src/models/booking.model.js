const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        hustle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hustle",
            required: true
        },

        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        freelancer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled"],
            default: "confirmed"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Booking", bookingSchema);