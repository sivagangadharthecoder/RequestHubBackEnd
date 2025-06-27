import FormModel from "../models/LeaveRequest.js";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config()

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
        reason, startDate, endDate, email
    } = req.body;

    const receiptPath = req.file ? `pdfs/${req.file.filename}` : null;
    const submittedAt = new Date().toLocaleString();

    try {
        const formData = new FormModel({
            name,
            rollNumber,
            college,
            branch,
            semester,
            email,
            reason,
            startDate,
            endDate,
            receiptPath,
        });
        await formData.save();

        const attachments = req.file ? [{
            filename: req.file.originalname,
            path: receiptPath,
        }] : [];

        const userEmailContent = `
Hello ${name}!

We have received the following details from your leave request form:

────────────────────────────
👤 Name              : ${name}
🆔 Roll Number       : ${rollNumber}
🏫 College           : ${college}
📚 Branch            : ${branch}
📘 Semester          : ${semester}
💭 Reason            : ${reason}
📅 Start Date        : ${startDate}
📅 End Date          : ${endDate}
🕒 Submitted At      : ${submittedAt}
────────────────────────────

📌 Please keep this email for your reference. We will email you again to approve or reject.

Best regards,  
College Administration
    `;

        const adminEmailContent = `
📥 NEW LEAVE REQUEST RECEIVED

Submitted At: ${submittedAt}

────────────────────────────
👤 Name              : ${name}
🆔 Roll Number       : ${rollNumber}
🏫 College           : ${college}
📚 Branch            : ${branch}
📘 Semester          : ${semester}
📧 Email             : ${email}
💭 Reason:           : ${reason}
📅 Start Date        : ${startDate}
📅 End Date          : ${endDate}
📎 Receipt       : ${req.file?.originalname || "No file uploaded"}
────────────────────────────

🔔 Please review the attached receipt and application data in your admin panel.
    `;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "✅ Leave Request Confirmation",
            text: userEmailContent,
            attachments,
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL,
            subject: "📥 New Leave Request Submission",
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
        const applications = await FormModel.find().sort({ createdAt: -1 });
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
            const emailContent = `We are pleased to inform you that your leave request has been approved!\n\nApplication Details:\nName: ${application.name}\nRoll Number: ${application.rollNumber}\nCollege: ${application.college}\nSemester: ${application.semester}\nBranch: ${application.branch}\nReason: ${application.reason}\nStart Date: ${application.startDate}\nEnd Date: ${application.endDate}\nStatus: Approved`;

            const attachments = [];
            if (application.receiptPath) {
                const absolutePath = path.join(__dirname, '../', application.receiptPath);

                if (fs.existsSync(absolutePath)) {
                    attachments.push({
                        filename: 'Approved_Leave_Request.pdf',
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
                    subject: "Leave Request Approved",
                    text: emailContent,
                    attachments: attachments,
                });
                console.log("Approval email sent to:", application.email);
            } catch (emailError) {
                console.error("Error sending approval email:", emailError);
            }
        }

        res.status(200).json({
            success: true,
            message: "Request approved",
            application,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
};
export const rejectApplication = async (req, res) => {
    try {
        const { id, reason } = req.body;
        if (!id) return res.status(400).json({ error: "ID is required" });

        const application = await FormModel.findByIdAndUpdate(
            id,
            { status: "Rejected", remarks: reason },
            { new: true }
        );

        if (!application) {
            return res.status(404).json({ success: false, error: "Application not found" });
        }

        if (application.email) {
            const emailContent = `We regret to inform you that your leave request has been rejected.

────────────────────────────
👤 Name        : ${application.name}
🆔 Roll Number : ${application.rollNumber}
🏫 College     : ${application.college}
📚 Branch      : ${application.branch}
📘 Semester    : ${application.semester}
💭 Reason      : ${application.reason}
📅 Start Date  : ${application.startDate}
📅 End Date    : ${application.endDate}
❌ Rejection Reason (Remarks):
"${reason || 'No reason provided'}"
────────────────────────────

Regards,  
College Administration`;

            const attachments = [];
            if (application.receiptPath) {
                const absolutePath = path.join(__dirname, '../', application.receiptPath);
                if (fs.existsSync(absolutePath)) {
                    attachments.push({
                        filename: 'Rejected_Leave_Request.pdf',
                        path: absolutePath,
                        contentType: 'application/pdf',
                    });
                } else {
                    console.warn("File not found for rejection email:", absolutePath);
                }
            }

            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: application.email,
                    subject: "Leave Request Rejected",
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
            message: "Request rejected",
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

        if (application.receiptPath) {
            fs.unlink(application.receiptPath, (err) => {
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
        const applications = await FormModel.find({ status: 'Approved' });
        res.status(200).json({ success: true, applications });
    } catch (error) {
        console.error("❌ Error fetching submissions:", error);
        res.status(500).json({ success: false, message: "Something went wrong." });
    }
};

export const getRejectedApplications = async (req, res) => {
    try {
        const applications = await FormModel.find({ status: 'Rejected' });
        res.status(200).json({ success: true, applications });
    } catch (error) {
        console.error("❌ Error fetching submissions:", error);
        res.status(500).json({ success: false, message: "Something went wrong." });
    }
};

export const getPendingApplications = async (req, res) => {
    try {
        const applications = await FormModel.find({ status: 'Pending' });
        res.status(200).json({ success: true, applications });
    } catch (error) {
        console.error("❌ Error fetching submissions:", error);
        res.status(500).json({ success: false, message: "Something went wrong." });
    }
};