import FormModel from "../models/hackathonModel.js";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  secure: true,
  tls: {
    rejectUnauthorized: false,
  },
});

export const submitForm = async (req, res) => {
  const {
    name, rollNumber, college, branch, semester,
    hackathonInstitute, startDate, endDate, email
  } = req.body;

  const hackathonCertificatePath = req.file ? path.join('hackathonuploads', req.file.filename) : null;
  const submittedAt = new Date().toLocaleString();

  try {
    const formData = new FormModel({
      name,
      rollNumber,
      college,
      branch,
      semester,
      email,
      hackathonInstitute,
      startDate,
      endDate,
      hackathonCertificatePath
    });
    await formData.save();

    const absolutePath = req.file ? path.join(__dirname, '..', hackathonCertificatePath) : null;

    const attachments = req.file ? [{
      filename: req.file.originalname,
      path: absolutePath,
    }] : [];

    const userEmailContent = `
🎉 Hello ${name}!

Thank you for submitting your Hackathon Application. We have received the following details:

────────────────────────────
👤 Name              : ${name}
🆔 Roll Number       : ${rollNumber}
🏫 College           : ${college}
📚 Branch            : ${branch}
📘 Semester          : ${semester}
🏢 Hackathon Institute: ${hackathonInstitute}
📅 Start Date        : ${startDate}
📅 End Date          : ${endDate}
🕒 Submitted At      : ${submittedAt}
────────────────────────────

📌 Please keep this email for your reference. We'll reach out if anything else is needed.

Best regards,  
College Support Team
    `;

    const adminEmailContent = `
📥 NEW HACKATHON APPLICATION RECEIVED

Submitted At: ${submittedAt}

────────────────────────────
👤 Name              : ${name}
🆔 Roll Number       : ${rollNumber}
🏫 College           : ${college}
📚 Branch            : ${branch}
📘 Semester          : ${semester}
📧 Email             : ${email}
🏢 Hackathon Institute: ${hackathonInstitute}
📅 Start Date        : ${startDate}
📅 End Date          : ${endDate}
📎 Certificate       : ${req.file?.originalname || "No file uploaded"}
────────────────────────────

🔔 Please review the attached certificate and application data in your admin panel.
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "✅ Hackathon Application Confirmation",
      text: userEmailContent,
      attachments,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "📥 New Hackathon Application Submission",
      text: adminEmailContent,
      attachments,
    });

    res.status(200).json({ success: true, message: "Form submitted and emails sent!" });

  } catch (error) {
    console.error("❌ Error in submitting form:", error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

export const getApplications = async (req, res) => {
  try {
    const applications = await FormModel.find();
    res.status(200).json({ success: true, applications });
  } catch (error) {
    console.error("❌ Error fetching submissions:", error);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

export const approveApplication = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID is required" });

    const application = await FormModel.findByIdAndUpdate(
      id,
      { status: "Approved" },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    if (application.email) {
      const emailContent = `We are pleased to inform you that your hackathon application has been approved!\n\nApplication Details:\nName: ${application.name}\nRoll Number: ${application.rollNumber}\nCollege: ${application.college}\nSemester: ${application.semester}\nBranch: ${application.branch}\nHackathon Institute: ${application.hackathonInstitute}\nStart Date: ${application.startDate}\nEnd Date: ${application.endDate}\nStatus: Approved`;

      const attachments = [];
      if (application.hackathonCertificatePath) {
        const absolutePath = path.join(__dirname, '..', application.hackathonCertificatePath);
        if (fs.existsSync(absolutePath)) {
          attachments.push({
            filename: 'Approved_Hackathon_Application.pdf',
            path: absolutePath,
            contentType: 'application/pdf',
          });
        } else {
          console.warn("File not found:", absolutePath);
        }
      }

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: application.email,
          subject: "Hackathon Application Approved",
          text: emailContent,
          attachments,
        });
        console.log("Approval email sent to:", application.email);
      } catch (emailError) {
        console.error("Error sending approval email:", emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Application approved",
      application,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const rejectApplication = async (req, res) => {
  try {
    const { id, remarks } = req.body;
    if (!id) return res.status(400).json({ error: "ID is required" });

    const application = await FormModel.findByIdAndUpdate(
      id,
      { status: "Rejected", remarks: remarks || "" },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    // Send rejection email with remarks
    if (application.email) {
      const emailContent = `
We are sorry to inform you that your hackathon application has been rejected.

Application Details:
────────────────────────────
👤 Name              : ${application.name}
🆔 Roll Number       : ${application.rollNumber}
🏫 College           : ${application.college}
📘 Semester          : ${application.semester}
📚 Branch            : ${application.branch}
🏢 Hackathon Institute: ${application.hackathonInstitute}
📅 Start Date        : ${application.startDate}
📅 End Date          : ${application.endDate}
💬 Rejection Remarks : ${application.remarks || "No remarks provided"}
────────────────────────────

If you have any questions, feel free to contact the administration.
      `;

      const attachments = [];
      if (application.hackathonCertificatePath) {
        const absolutePath = path.join(__dirname, '..', application.hackathonCertificatePath);
        if (fs.existsSync(absolutePath)) {
          attachments.push({
            filename: 'Rejected_Hackathon_Application.pdf',
            path: absolutePath,
            contentType: 'application/pdf',
          });
        } else {
          console.warn("File not found:", absolutePath);
        }
      }

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: application.email,
          subject: "Hackathon Application Rejected",
          text: emailContent,
          attachments,
        });
        console.log("Rejection email sent to:", application.email);
      } catch (emailError) {
        console.error("Error sending rejection email:", emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Application rejected with remarks",
      application,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};
export const deleteApplication = async (req, res) => {
  const { id } = req.params;

  try {
    const application = await FormModel.findByIdAndDelete(id);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (application.hackathonCertificatePath) {
      const filePath = path.join(__dirname, '..', application.hackathonCertificatePath);
      fs.unlink(filePath, (err) => {
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
    console.error("Error fetching approved applications:", error);
    res.status(500).json({ error: "Failed to fetch approved applications" });
  }
};

export const getRejectedApplications = async (req, res) => {
  try {
    const applications = await FormModel.find({ status: 'Rejected' }).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching rejected applications:", error);
    res.status(500).json({ error: "Failed to fetch rejected applications" });
  }
};

export const getPendingApplications = async (req, res) => {
  try {
    const applications = await FormModel.find({ status: 'Pending' }).sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    res.status(500).json({ error: "Failed to fetch pending applications" });
  }
};

