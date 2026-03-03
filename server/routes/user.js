// routes/auth.routes.js
import express from 'express';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

// Helper to generate both tokens and save refresh token to DB
const generateTokens = async (user) => {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
};

// -------------------------------------------
// POST /api/login
// -------------------------------------------
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: 'Email and password are required' });

    try {
        const user = await User.findOne({ email });
        if (!user)
            return res.status(401).json({ message: 'Invalid email or password' });

        const isMatch = await user.isPasswordCorrect(password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid email or password' });

        const { accessToken, refreshToken } = await generateTokens(user);

        return res.status(200).json({
            Username: user.name,       // <-- matches what AuthContext destructures
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// -------------------------------------------
// POST /api/register
// -------------------------------------------
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ message: 'All fields are required' });

    try {
        const existing = await User.findOne({ email });
        if (existing)
            return res.status(409).json({ message: 'Email already registered' });

        const user = new User({
            _id: new mongoose.Types.ObjectId().toString(),
            name,
            email,
            password,      // pre-save hook hashes this automatically
        });

        await user.save();

        return res.status(201).json({ message: 'Registration successful. Please log in.' });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// -------------------------------------------
// POST /api/logout
// -------------------------------------------
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;

    try {
        // Clear the refresh token from DB so it can't be reused
        await User.findOneAndUpdate(
            { refreshToken },
            { $unset: { refreshToken: "" } }
        );
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// -------------------------------------------
// POST /api/refresh
// -------------------------------------------
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken)
        return res.status(401).json({ message: 'Refresh token required' });

    try {
        // Verify the token is valid
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        // Check it matches what's stored in DB (prevents reuse after logout)
        const user = await User.findOne({ _id: decoded._id, refreshToken });
        if (!user)
            return res.status(403).json({ message: 'Invalid refresh token' });

        const accessToken = user.generateAccessToken();

        return res.status(200).json({ accessToken });
    } catch (err) {
        console.error('Refresh error:', err);
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
});

router.get('/me', verifyJWT, async (req, res) => {
    try {
        // req.user was populated by your verifyJWT middleware
        const user = await User.findById(req.user._id).select("-password -refreshToken");
        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json(user);
    } catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
});

export default router;