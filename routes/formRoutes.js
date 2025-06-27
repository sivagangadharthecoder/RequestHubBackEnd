import express from "express";
import multer from "multer";
import path from "path";
import {
  submitForm,
  getApplications,
  approveApplication,
  rejectApplication,
  deleteApplication,
  getApprovedApplications,
  getRejectedApplications,
  getPendingApplications,
} from "../controllers/formController.js";

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage }).single("offerLetter");


router.post("/submit-form", upload, submitForm);

router.get("/applications", getApplications);
router.put("/approve-application", approveApplication);
router.put("/reject-application", rejectApplication);
router.delete("/delete-application/:id", deleteApplication);

router.get("/applicationsApproved", getApprovedApplications);
router.get("/applicationsRejected", getRejectedApplications);
router.get("/applicationsPending", getPendingApplications);

export default router;  
