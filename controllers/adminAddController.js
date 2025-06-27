import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import adminAddModel from "../models/adminAddModel.js";
import transport from "../config/nodemailer.js";

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const getCookieOptions = (req) => {
    const isLocalhost = req.headers.origin?.includes('localhost');
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        domain: isLocalhost ? undefined : ".yourdomain.com",
        path: "/"
    };
};

const sendEmail = async (mailOptions) => {
    return new Promise((resolve, reject) => {
        transport.sendMail(mailOptions, (error, info) => {
            if (error) reject(error);
            else resolve(info);
        });
    });
};

export const register = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please Fill All Fields !"
            });
        }

        const existingUser = await adminAddModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User Already Exists !"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await adminAddModel.create({
            email,
            password: hashedPassword
        });

        const token = generateToken(user._id);
        res.cookie("token", token, getCookieOptions(req));

        await sendEmail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "🎉 Congratulations! You're Now a RequestHub Admin",
            text: `Hi!,

We're pleased to inform you that you've been added as an administrator to RequestHub!

As an admin, you now have access to powerful tools to:
- Manage and oversee all user requests
- Approve or reject submissions
- Monitor platform activity
- Help maintain the RequestHub community

This is a recognition of your expertise and trust within our organization. We're confident you'll help us maintain the high standards of our platform.

If you have any questions about your new responsibilities or need guidance, please don't hesitate to reach out.

Welcome to the admin team!

Best regards,
The RequestHub Team`,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2c3e50;">Congratulations, </h1>
        <p>You've been granted <strong>admin privileges</strong> for RequestHub!</p>
        
        <h3 style="color: #3498db;">Your new admin capabilities include:</h3>
        <ul style="line-height: 1.6;">
            <li>Managing and overseeing all user requests</li>
            <li>Approving or rejecting submissions</li>
            <li>Monitoring platform activity and metrics</li>
            <li>Helping maintain our community standards</li>
        </ul>
        
        <p style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #3498db;">
            This promotion reflects the trust we have in your judgment and expertise. 
            We're excited to have you join our admin team!
        </p>
        
        <p>If you need any guidance about your new responsibilities, please reach out.</p>
        
        <p style="margin-top: 30px;">Welcome aboard,<br>
        <strong>The RequestHub Admin Team</strong></p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #7f8c8d;">RequestHub - Powering efficient request management</p>
    </div>`
        });

        return res.json({
            success: true,
            message: "Admin Added Successfully",
        });

    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    console.log("Login attempt with email:", email);

    try {
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please Fill All Fields !"
            });
        }

        const user = await adminAddModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials !"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials !"
            });
        }

        const token = generateToken(user._id);
        res.cookie("token", token, getCookieOptions(req));

        return res.json({
            success: true,
            message: "Login Success !",
            user: {
                _id: user._id,
                email: user.email,
            }
        });

    } catch (error) {
        console.error("Login Error: ", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/"
    });

    return res.json({
        success: true,
        message: "Logout Success !"
    });
};

export const sendResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Please provide an email address" });
    }

    try {
        const user = await adminAddModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found!" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 10 * 60 * 1000;

        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "🔐 Dear Admin. Reset Your RequestHub Password",
            text: `Hi,\n\nYour OTP for password reset is ${otp}. It is valid for 10 minutes.\n\nThanks,\nRequestHub Team`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Hi, </h2>
                    <p>We received a request to reset your password.</p>
                    <p>Your OTP for password reset is:</p>
                    <div style="font-size: 22px; font-weight: bold; color: #2F54EB; background-color: #F0F4FF; padding: 12px 24px; width: fit-content; border-radius: 8px; border: 1px solid #d6e4ff;">
                        ${otp}
                    </div>
                    <p>This code is valid for <strong>10 minutes</strong>.</p>
                    <p>If you didn’t request this, please ignore this email.</p>
                    <br/>
                    <p>Warm regards,</p>
                    <p><strong>The RequestHub Team</strong></p>
                </div>
            `
        };

        transport.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).json({
                    success: false,
                    message: "Failed to send reset OTP email.",
                });
            }

            console.log("Reset OTP email sent:", info.response);
            return res.status(200).json({
                success: true,
                message: "Reset OTP sent successfully to your email.",
            });
        });

    } catch (err) {
        console.error("Error in sendResetOtp:", err);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: "Please fill all the fields" });
    }

    try {
        const user = await adminAddModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found!" });
        }

        if (user.resetOtp !== otp || user.resetOtp === '') {
            return res.status(400).json({ success: false, message: "Invalid OTP!" });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP expired!" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({ success: true, message: "Password reset successfully!" });

    }
    catch (error) {
        return res.json({ success: false, message: error.message });
    }
};


