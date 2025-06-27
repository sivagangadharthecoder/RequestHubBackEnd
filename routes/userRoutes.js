import express from 'express';
import userAuth from '../middleware/userAuth.js';
import getUserData from '../controllers/userController.js';
import FormSubmission from '../models/formModel.js';
import HackathonSubmission from '../models/hackathonModel.js';
import LeaveRequest from '../models/LeaveRequest.js';
import IdRequest from '../models/IdRequest.js';

const userRouter = express.Router();

userRouter.get('/data', userAuth, getUserData);

// @route   GET /api/user/request-counts
// @desc    Get counts of pending, accepted, rejected, and total requests for a user
// @access  Private (requires authentication)
userRouter.get('/request-counts', userAuth, async (req, res) => {
  try {
    const userId = req.user._id; // Use _id directly from req.user
    console.log('User _id from token:', userId.toString());
    const userEmail = req.user.email; // Email from user document
    console.log('User email for counts:', userEmail);

    if (!userEmail) {
      throw new Error('User email not found in token data');
    }

    // Aggregate counts from each collection with case-insensitive email match
    const hackathonCounts = await HackathonSubmission.aggregate([
      { $match: { email: { $regex: new RegExp(`^${userEmail}$`, 'i') } } },
      { $group: { _id: { $toLower: '$status' }, count: { $sum: 1 } } }
    ]);
    console.log('Hackathon counts:', hackathonCounts);

    const internshipCounts = await FormSubmission.aggregate([
      { $match: { email: { $regex: new RegExp(`^${userEmail}$`, 'i') } } },
      { $group: { _id: { $toLower: '$status' }, count: { $sum: 1 } } }
    ]);
    console.log('Internship counts:', internshipCounts);

    const leaveCounts = await LeaveRequest.aggregate([
      { $match: { email: { $regex: new RegExp(`^${userEmail}$`, 'i') } } },
      { $group: { _id: { $toLower: '$status' }, count: { $sum: 1 } } }
    ]);
    console.log('Leave counts:', leaveCounts);

    const idCounts = await IdRequest.aggregate([
      { $match: { email: { $regex: new RegExp(`^${userEmail}$`, 'i') } } },
      { $group: { _id: { $toLower: '$status' }, count: { $sum: 1 } } }
    ]);
    console.log('ID counts:', idCounts);

    // Combine counts
    const counts = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      total: 0
    };

    // Process each collection's counts
    [hackathonCounts, internshipCounts, leaveCounts, idCounts].forEach(collection => {
      collection.forEach(item => {
        const status = item._id === 'approved' ? 'accepted' : item._id;
        if (status === 'pending') counts.pending += item.count;
        if (status === 'accepted') counts.accepted += item.count;
        if (status === 'rejected') counts.rejected += item.count;
      });
    });

    // Calculate total
    counts.total = counts.pending + counts.accepted + counts.rejected;

    console.log('Final counts:', counts);
    res.json(counts);
  } catch (err) {
    console.error('Error in /request-counts:', err.message);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
});

export default userRouter;