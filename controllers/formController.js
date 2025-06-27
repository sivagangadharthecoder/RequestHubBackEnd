import FormModel from "../models/formModel.js";
import nodemailer from "nodemailer";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const submitForm = async (req, res) => {
  const {
    name, rollNumber, college, branch, semester,
    internshipInstitute, startDate, endDate, email
  } = req.body;
  const offerLetterPath = req.file ? req.file.path : null;

  try {
    const formData = new FormModel({
      name, rollNumber, college, branch, semester,
      internshipInstitute, startDate, endDate, email, offerLetterPath
    });
    await formData.save();

    const emailContent = `
      Name: ${name}
      Roll Number: ${rollNumber}
      College: ${college}
      Branch: ${branch}
      Semester: ${semester}
      Internship Institute: ${internshipInstitute}
      Start Date: ${startDate}
      End Date: ${endDate}
      Status: Pending
    `;

    const attachments = [];
    if (offerLetterPath) {
      attachments.push({
        filename: req.file.originalname || 'offer_letter.pdf',
        path: offerLetterPath,
        contentType: 'application/pdf'
      });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "✅Internship Application Form Submission",
      text: `Your application has been submitted successfully.\n\n${emailContent}`,
      attachments: attachments
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "📩New Internship Application",
      text: `New Internship application received:\n\n${emailContent}`,
      attachments: attachments
    });

    res.status(200).json({ success: true, message: "Form submitted and emails sent!" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

export const getApplications = async (req, res) => {
  try {
    const applications = await FormModel.find().sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

export const approveApplication = async (req, res) => {
  const { id } = req.body;

  console.log("Response:", id);

  try {
    const application = await FormModel.findByIdAndUpdate(
      id,
      { status: "Approved" },
      { new: true }
    );


    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const emailContent = `
      Your internship application has been Approved!
     
      Application Details:
      Name: ${application.name}
      Roll Number: ${application.rollNumber}
      College: ${application.college}
      Internship Institute: ${application.internshipInstitute}
      Start Date: ${application.startDate}
      End Date: ${application.endDate}
      \n\n Regards
      \n RequestHub Team
    `;

    const attachments = [];
    if (application.offerLetterPath) {
      attachments.push({
        filename: 'Approval_Offer_Letter.pdf',
        path: application.offerLetterPath,
        contentType: 'application/pdf'
      });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: application.email,
      subject: "Internship Application Approved",
      text: emailContent,
      attachments: attachments
    });

    res.status(200).json({ success: true, application });
  } catch (error) {
    console.error("Error approving application:", error);
    res.status(500).json({ error: "Failed to approve application" });
  }
};

export const rejectApplication = async (req, res) => {
  const { id} = req.body;

  try {
    const application = await FormModel.findByIdAndUpdate(
      id,
      { status: "Rejected"},
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const emailContent = `
      Your internship application has been Rejected.
     
      Application Details:
      Name: ${application.name}
      Roll Number: ${application.rollNumber}
      College: ${application.college}
      Internship Institute: ${application.internshipInstitute}
      Start Date: ${application.startDate}
      End Date: ${application.endDate}
     
      Reason for Rejection: ${reason || 'Not specified'}
     
      \n\nRegards,
      \nRequestHub Team
    `;

    const attachments = [];
    if (application.offerLetterPath) {
      attachments.push({
        filename: 'Rejected_Offer_Letter.pdf',
        path: application.offerLetterPath,
        contentType: 'application/pdf'
      });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: application.email,
      subject: "Internship Application Rejected",
      text: emailContent,
      attachments: attachments
    });

    res.status(200).json({ success: true, application });
  } catch (error) {
    console.error("Error rejecting application:", error);
    res.status(500).json({ error: "Failed to reject application" });
  }
};

export const deleteApplication = async (req, res) => {
  const { id } = req.params;

  try {
    const application = await FormModel.findByIdAndDelete(id);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (application.offerLetterPath) {
      fs.unlink(application.offerLetterPath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting application:", error);
    res.status(500).json({ error: "Failed to delete application" });
  }
};

export const getApprovedApplications = async (req, res) => {
  try {
    const applications = await FormModel.find({ status: 'Approved' }).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

export const getRejectedApplications = async (req, res) => {
  try {
    const applications = await FormModel.find({ status: 'Rejected' }).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};

export const getPendingApplications = async (req, res) => {
  try {
    const applications = await FormModel.find({ status: 'Pending' }).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
};