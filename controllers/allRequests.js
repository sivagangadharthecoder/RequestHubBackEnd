import FormSubmission from '../models/formModel.js';
import IdRequest from '../models/IdRequest.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Hackathon from '../models/hackathonModel.js';

export const getAllRequests = async (req, res) => {
  try {
    const internship = await FormSubmission.find();
    const leave = await LeaveRequest.find();
    const id = await IdRequest.find();
    const hackathon = await Hackathon.find();

    res.status(200).json({
      internship,
      leave,
      id,
      hackathon
    });
  } catch (error) {
    console.error("Error fetching all requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
