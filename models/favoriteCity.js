import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    latitude: {
        type: Number,
        min: -90,
        max: 90,
        required: true
    },
    longitude: {
        type: Number,
        min: -180,
        max: 180,
        required: true
    },
});

const City = new mongoose.model('City', citySchema);

export default City;