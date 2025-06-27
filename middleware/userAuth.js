import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const userAuth = async (req, res, next) => {
  try {
    // Get token from cookie
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized! No token provided." });
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in the database
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized! User not found." });
    }

    // Attach user info to request object
    req.user = user;
    req.rollNumber = user.rollNumber;
    next();
  } catch (error) {
    console.error("Auth Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Unauthorized! " + (error.name === "TokenExpiredError" ? "Token expired." : "Invalid token."),
    });
  }
};

export default userAuth;
