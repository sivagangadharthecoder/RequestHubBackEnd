import express from 'express';
const router = express.Router();

import HackathonSubmission from '../models/hackathonModel.js';
import FormSubmission from '../models/formModel.js';
// In your admin.js
router.post('/admin/bulk-approve-ids', async (req, res) => {
  const { type, daysAhead } = req.body;

  if (!type || !daysAhead) {
    return res.status(400).json({ error: "Type and daysAhead are required." });
  }

  try {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + parseInt(daysAhead));

    const startDateStr = today.toISOString().split('T')[0];
    const endDateStr = future.toISOString().split('T')[0];

    let model;

    if (type === "hackathon") model = HackathonSubmission;
    else if (type === "internship") model = FormSubmission;
    // Add other types here if needed
    else return res.status(400).json({ error: "Invalid request type." });

    const docs = await model.find({
      status: "Pending",
      startDate: { $gte: startDateStr, $lte: endDateStr },
    });

    const ids = docs.map((doc) => doc._id);

    return res.json({ ids });
  } catch (err) {
    console.error("Error in fetching IDs for bulk:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;

