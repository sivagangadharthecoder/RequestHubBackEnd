import mongoose from "mongoose";

const IdRequestSchema = new mongoose.Schema({
  studentName: String,
  rollNumber: String,
  year: String,
  department: String,
  residence: String,
  college: String,
  phone: String,
  email: String,
  transport: String,
  requestDate: { type: String, default: new Date().toISOString().split('T')[0] },
  reason: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
});

export default mongoose.model("IdRequest", IdRequestSchema);
