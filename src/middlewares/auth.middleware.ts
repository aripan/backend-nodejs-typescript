import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { IUser, User } from "../models/user.model";

// Define a custom interface that extends Request
interface CustomRequest extends Request {
  user?: IUser; // Add user property to Request
}

/*
!IMPORTANT: if the res is not being used, then we can use _ instead of res
*/

export const verifyJWT = asyncHandler(async (req: CustomRequest, _: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload;

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    // Assign user to the user property of the request object
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(401, error?.message);
    }
    throw new ApiError(401, "Invalid access token");
  }
});
