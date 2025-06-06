import jwt from "jsonwebtoken"
import User from "../models/User.model.js"

export const protectRoute = async (req, res, next)=>{
    try {
        const token = req.cookies.jwt;
        if(!token) {
            return res.status(401).json({message: "Unauthorized - no token provided"})
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if(!decoded) {
            return res.status(401).json({message: "Unauthorized- Invalid Token"})
        }

        const user = await User.findOne({ _id: decoded.userId }).select("-password");

        if(!user){
            return res.status(401).json({message: "unauthorized - user not found"})
        }

        req.user = user;

        next();
    } catch (error) {
        console.log("error verifying protectRoute", error.message)
        res.status(401).json({message: "internal server error"})
    }
}