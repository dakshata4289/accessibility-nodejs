import { Request, Response } from "express";
import validator from "validator";
import User from "../models/userModel";
import { connect } from "../dbConfig/dbConfig";

// Ensure database connection
connect();

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // ✅ Validate email
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // ✅ Normalize email
    const normalizedEmail = email.toLowerCase();

    // ✅ Check if user exists
    let user = await User.findOne({ email: normalizedEmail });

    // ✅ Create new user if not exists
    if (!user) {
      user = new User({ email: normalizedEmail });
      await user.save();
    }

    return res.json({
      success: true,
      message: "User registered successfully.",
      user: { email: user.email },
    });
  } catch (err) {
    console.error("User registration failed:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to register user.",
    });
  }
};
