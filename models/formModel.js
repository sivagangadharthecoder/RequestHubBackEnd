import mongoose from "mongoose";

const formSchema = new mongoose.Schema({
  name: String,
  rollNumber: String,
  college: String,
  branch: String,
  semester: String,
  internshipInstitute: String,
  startDate: String,
  endDate: String,
  email: String,
  offerLetterPath: String,
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("FormSubmission", formSchema);