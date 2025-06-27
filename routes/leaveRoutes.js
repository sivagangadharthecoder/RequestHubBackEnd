import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import {
    submitForm,
    getApplications,
    approveApplication,
    rejectApplication,
    deleteApplication,
    getApprovedApplications,
    getRejectedApplications,
    getPendingApplications,
} from "../controllers/leaveController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../pdfs');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage }).single("receipt");


router.post("/submit-leave", upload, submitForm);

router.get("/applications3", getApplications);
router.put("/approve-application3", approveApplication);
router.put("/reject-application3", rejectApplication);
router.delete("/delete-application3/:id", deleteApplication);

router.get("/applications3Approved", getApprovedApplications);
router.get("/applications3Rejected", getRejectedApplications);
router.get("/applications3Pending", getPendingApplications);

export default router;