import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  submitForm,
  getApplications,
  approveApplication,
  rejectApplication,
  deleteApplication,
  getApprovedApplications,
  getRejectedApplications,
  getPendingApplications,
} from "../controllers/hackathonController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'hackathonuploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
}).single("hackathoncertificate");



router.post("/submit-hackathon", upload, submitForm);

router.get("/applications2", getApplications);
router.put("/approve-application2", approveApplication);
router.put("/reject-application2", rejectApplication);
router.delete("/delete-application2/:id", deleteApplication);

router.get("/applications2Approved", getApprovedApplications);
router.get("/applications2Rejected", getRejectedApplications);
router.get("/applications2Pending", getPendingApplications);

export default router;