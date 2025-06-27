import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transport from "../config/nodemailer.js";

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const getCookieOptions = () => {
    return {
        httpOnly: true,
        secure: true, // Required for HTTPS (Render uses HTTPS)
        sameSite: "None", // Required for cross-origin cookies
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
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
    const { name, rollNumber, email, password } = req.body;

    try {
        if (!name || !rollNumber || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            name,
            rollNumber,
            email,
            password: hashedPassword
        });

        const token = generateToken(user._id);
        res.cookie("token", token, getCookieOptions(req));

        await sendEmail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "🎉 Welcome to RequestHub!",
            text: `Hi ${name},\n\nWelcome to RequestHub...`,
            html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fc; padding: 30px; border-radius: 10px; color: #213448; max-width: 600px; margin: auto; border: 1px solid #ddd;">
  <h2 style="color: #547792;">🎉 Welcome to RequestHub!</h2>
  <p>Hi <strong>{{name}}</strong>,</p>
  <p>We're excited to have you onboard. RequestHub is your one-stop portal for managing academic requests with <strong>efficiency</strong> and <strong>clarity</strong>.</p>

  <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">

  <h3 style="color: #94B4C1;">What you can do on RequestHub:</h3>
  <ul style="padding-left: 20px;">
    <li><strong>Internship</strong> – Submit and track internship permissions</li>
    <li><strong>ID Card</strong> – Request for new or duplicate ID cards</li>
    <li><strong>Hackathon</strong> – Apply for academic events and competitions</li>
    <li><strong>Leave</strong> – Easily manage your academic leave applications</li>
  </ul>

  <p>Here's how it works in 5 simple steps:</p>
  <ol style="padding-left: 20px;">
    <li>Register/Login with your credentials</li>
    <li>Verify your email using the OTP</li>
    <li>Select the desired academic service</li>
    <li>Fill in the required form details</li>
    <li>Submit and track your request's progress</li>
  </ol>

  <div style="margin: 30px 0;">
    <a href="https://request-hub-52.vercel.app/" style="background-color: #547792; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">🚀 Get Started Now</a>
  </div>

  <p>Need help? Contact us at <a href="mailto:gsivagangadhar366@gmail.com">Support Mail</a></p>

  <p style="margin-top: 30px; font-size: 14px; color: #777;">
    Best regards,<br>
    The RequestHub Team
  </p>
</div>
`
        });

        return res.json({
            success: true,
            message: "Registration successful"
        });

    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const login = async (req, res) => {
    const { rollNumber, email, password } = req.body;

    try {
        if (!rollNumber || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all fields"
            });
        }

        const user = await userModel.findOne({ rollNumber, email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const token = generateToken(user._id);
        res.cookie("token", token, getCookieOptions(req));

        return res.json({
            success: true,
            message: "Login successful",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                rollNumber: user.rollNumber,
                isAccountVerified: user.isAccountVerified
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/"
    });

    return res.json({
        success: true,
        message: "Logout successful"
    });
};

export const sendVerifyOtp = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isAccountVerified) {
            return res.status(400).json({
                success: false,
                message: "Account is already verified."
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 10 * 60 * 1000;

        await user.save();

        const { email, name } = user;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "🔐 Verify Your RequestHub Account",
            text: `Hi ${name},\n\nWelcome to RequestHub!\n\nYour OTP is ${otp}. It is valid for 10 minutes.\n\nThanks,\nRequestHub Team`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Hi ${name},</h2>
                    <p>🎉 <strong>Welcome to RequestHub!</strong> We're thrilled to have you with us.</p>
                    <p>Please use the OTP below to verify your account. This code is valid for <strong>10 minutes</strong>:</p>
                    <div style="font-size: 22px; font-weight: bold; color: #2F54EB; background-color: #F0F4FF; padding: 12px 24px; width: fit-content; border-radius: 8px; border: 1px solid #d6e4ff;">
                        ${otp}
                    </div>
                    <p>If you didn't request this, please ignore this email.</p>
                    <br/>
                    <p>Warm regards,</p>
                    <p><strong>The RequestHub Team</strong></p>
                </div>
            `
        };

        await new Promise((resolve, reject) => {
            transport.sendMail(mailOptions, (error, info) => {
                if (error) return reject(error);
                resolve(info);
            });
        });

        return res.status(200).json({
            success: true,
            message: "Verification email sent successfully.",
        });

    } catch (error) {
        console.error("Error in sendVerifyOtp:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "An unexpected error occurred.",
        });
    }
};

export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
        return res.status(400).json({ success: false, message: "Missing Details" });
    }

    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found!" });
        }

        if (user.verifyOtp !== otp || user.verifyOtp === '') {
            return res.status(400).json({ success: false, message: "Invalid OTP!" });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP expired!" });
        }
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();

        return res.json({ success: true, message: "Account verified successfully!" });

    }
    catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const isAuthenticated = async (req, res) => {
    try {
        return res.json({ success: true });
    } catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
};

export const sendResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Please provide an email address" });
    }

    try {
        const user = await userModel.findOne({ email });

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
            subject: "🔐 Reset Your RequestHub Password",
            text: `Hi ${user.name},\n\nYour OTP for password reset is ${otp}. It is valid for 10 minutes.\n\nThanks,\nRequestHub Team`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Hi ${user.name},</h2>
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
        const user = await userModel.findOne({ email });

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

export const sendResetOtp2 = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Please provide an email address" });
    }

    try {
        const user = await userModel.findOne({ email });

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
            subject: "🔐 Reset Your RequestHub Password",
            text: `Hi ${user.name},\n\nYour OTP for changing username is ${otp}. It is valid for 10 minutes.\n\nThanks,\nRequestHub Team`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Hi ${user.name},</h2>
                    <p>We received a request to change your username.</p>
                    <p>Your OTP for changing username is:</p>
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

export const changeUsername = async (req, res) => {
    const { email, otp, newUsername } = req.body;

    if (!email?.trim() || !otp?.trim() || !newUsername?.trim()) {
        return res.status(400).json({
            success: false,
            message: "All fields are required and cannot be empty"
        });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email"
            });
        }

        if (!user.resetOtp || user.resetOtp === '') {
            return res.status(400).json({
                success: false,
                message: "No OTP was generated for this account"
            });
        }

        if (user.resetOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP entered"
            });
        }

        if (user.resetOtpExpireAt < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one"
            });
        }

        if (user.name === newUsername) {
            return res.status(400).json({
                success: false,
                message: "New username cannot be same as current username"
            });
        }

        user.name = newUsername;
        user.resetOtp = '';
        user.resetOtpExpireAt = null;

        await user.save();

        return res.json({
            success: true,
            message: "Username changed successfully!",
            newUsername
        });

    } catch (error) {
        console.error("Username change error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during username change"
        });
    }
};