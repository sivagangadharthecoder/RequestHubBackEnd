import FormSubmission from '../models/formModel.js';
import IdRequest from '../models/IdRequest.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Hackathon from '../models/hackathonModel.js';

export const getDashboardOverview = async (req, res) => {
  try {
    const formCount = await FormSubmission.countDocuments();
    const idCount = await IdRequest.countDocuments();
    const leaveCount = await LeaveRequest.countDocuments();
    const hackathonCount = await Hackathon.countDocuments();

    const approvedCount = await Promise.all([
      FormSubmission.countDocuments({ status: 'Approved' }),
      IdRequest.countDocuments({ status: 'Approved' }),
      LeaveRequest.countDocuments({ status: 'Approved' }),
      Hackathon.countDocuments({ status: 'Approved' }),
    ]);

    const rejectedCount = await Promise.all([
      FormSubmission.countDocuments({ status: 'Rejected' }),
      IdRequest.countDocuments({ status: 'Rejected' }),
      LeaveRequest.countDocuments({ status: 'Rejected' }),
      Hackathon.countDocuments({ status: 'Rejected' }),
    ]);

    const pendingCount = await Promise.all([
      FormSubmission.countDocuments({ status: 'Pending' }),
      IdRequest.countDocuments({ status: 'Pending' }),
      LeaveRequest.countDocuments({ status: 'Pending' }),
      Hackathon.countDocuments({ status: 'Pending' }),
    ]);

    res.status(200).json({
      internshipCount: formCount,
      idCount,
      leaveCount,
      hackathonCount,
      approvedCount: approvedCount.reduce((a, b) => a + b, 0),
      rejectedCount: rejectedCount.reduce((a, b) => a + b, 0),
      pendingCount: pendingCount.reduce((a, b) => a + b, 0),
    });

    console.log("Form Count:", formCount);
console.log("ID Count:", idCount);
console.log("Leave Count:", leaveCount);
console.log("Hackathon Count:", hackathonCount);


  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
