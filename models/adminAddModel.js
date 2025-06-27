import mongoose from "mongoose";

const adminAdd = new mongoose.Schema({
    department: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    verifyOtp: {
        type: String,
        default: ''
    },
    verifyOtpExpireAt: {
        type: Number,
        default: 0,
    },
    resetOtp: {
        type: String,
        default: ''
    },
    resetOtpExpireAt: {
        type: Number,
        default: 0,
    },
});

const adminAddModel = mongoose.model("admin", adminAdd);

export default adminAddModel;