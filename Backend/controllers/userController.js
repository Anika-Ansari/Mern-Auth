import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import userModel from "../models/userModel.js"
import transporter from "../config/nodemailer.js"


//user register>>>>
export const register = async (req, res) => {

    const { name, email, password } = req.body

    if (!name || !email || !password) {
        return res.json({ sucess: false, message: "Missing Details" })
    }
    try {

        const existingUser = await userModel.findOne({ email })

        if (existingUser) {
            return res.json({ success: false, message: "user already exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({ name, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        //Sending welcome email
        const info = await transporter.sendMail({
            from: process.env.SENDER_EMAIL, // sender address
            to: email,
            subject: 'WElCOME TO MY WEBSITE',
            text: `WElCOME TO MY WEBSITE ,Your account has been created with email id: ${email}`
        });
        return res.json({ success: true });
    }
    catch (error) {
        res.json({ success: false, message: error.message })
    }
}


//user login>>>>
export const login = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.json({ success: false, message: "email and password are required" })
    }
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "Invalid email" })
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid password" })
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        return res.json({ success: true });
    }
    catch (error) {
        res.json({ success: false, message: error.message })
    }
}

//user logout>>>
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ?
                'none' : 'strict',
        })
        return res.json({ success: true, message: "logged Out" })
    }

    catch (error) {
        res.json({ success: false, message: error.message })
    }
}


//send verification otp to the user email:

export const sendVerifyOtp = async (req, res) => {
    try {
        const userId = req.userId; // 👈 direct use

        // const {userId } = req.body;

        const user = await userModel.findById(userId);
        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account already Verified" })
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000

        await user.save();
        const info = {
            from: process.env.SENDER_EMAIL, // sender address
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP Is ${otp} Verify your account using this
             OTP.`
        }
        await transporter.sendMail(info);
        res.json({ success: true, message: "Verification OTP sent on Email" })

    }
    catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// send verify email>>>>

export const verifyEmail = async (req, res) => {
    console.log("Request Body:", req.body);  
    //const { userId, otp } = req.body;

    const { otp } = req.body;
    const userId = req.userId;   

    if (!userId || !otp) {
        return res.json({ success: false, message: "Missing Details" })
    }

    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({ success: false, message: "Invalid otp" })
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTp Expired" })
        }
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save();
        return res.json({ success: true, message: "Email verify successfully" })

    }
    catch (error) {
        res.json({ success: false, message: error.message })
    }

}













