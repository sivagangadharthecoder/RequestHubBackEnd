// controllers/requestController.js

import FormSubmission from '../models/formModel.js';
import IdRequest from '../models/IdRequest.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Hackathon from '../models/hackathonModel.js';

export const getAllRequests = async (req, res) => {
  try {
    const [internships, leaves, ids, hackathons] = await Promise.all([
      FormSubmission.find(),
      LeaveRequest.find(),
      IdRequest.find(),
      Hackathon.find()
    ]);

    const mapData = (arr, type) =>
      arr.map(item => ({
        ...item._doc, // copy existing fields
        type,
      }));

    const combined = [
      ...mapData(internships, "internship"),
      ...mapData(leaves, "leave"),
      ...mapData(ids, "idcard"),
      ...mapData(hackathons, "hackathon"),
    ];

    res.json(combined);
  } catch (err) {
    console.error("Error fetching all requests:", err);
    res.status(500).json({ message: "Server error" });
  }
};
