import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "Access token required",
      timestamp: new Date().toISOString()
    });
  }

  try {
    const decoded = jwt.verify(token, config.accessTokenSecret) as { id: string, email: string, type?: string };
    
    // Ensure it's not a refresh token being used as access token
    if (decoded.type === "refresh") {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token type",
        timestamp: new Date().toISOString()
      });
    }
    
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false,
      message: "Invalid or expired token",
      timestamp: new Date().toISOString()
    });
  }
};;
