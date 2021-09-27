import { promisify } from "util";
import jwt from "jsonwebtoken";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

import User from "../models/user.js";
import ResetLog from "../models/resetLog.js";
import UserEvent from "../models/userEvent.js";

export const protect = catchAsync(async (req, res, next) => {
  // 1) Getting the token and check if its there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please login to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists exist
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exist.", 401)
    );
  }

  // 4) Check if user changed password after jsonwebtoken was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("You recently changed password! Please login again.", 401)
    );
  }

  // - update online times stamps
  if (currentUser.onlineTimestamp < Date.now() - 60 * 5) {
    currentUser.onlineTimestamp = Date.now();
    currentUser.loginTimes = currentUser.loginTimes + 1;
    await currentUser.save();
  }

  // GRANT ACCESS TO PROTECT ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

/**
 * restrictTo
 * @param  {...any} roles
 * @returns
 */
export function restrictTo(...roles) {
  return (req, res, next) => {
    // Roles ['user', 'team']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to access this page.", 403)
      );
    }
    next();
  };
}

/**
 * resetPasswordProtect
 * - RESET PASSWOrD ROUTE PROTECT
 */
export const resetPasswordProtect = catchAsync(async (req, res, next) => {
  // - 1 Check reset history
  const resetLog = await ResetLog.findOne({
    IP: req.ip,
    timestamp: {
      $gt: Date.now() - 15 * 60 * 1000
    }
  });

  // -  2 throw error if active
  if (resetLog) {
    return next(
      new AppError(
        "You have already requested a password reset in the last 15 minutes.",
        403
      )
    );
  }

  // - 3 next()
  next();
});

/**
 * - CHECK USER EVENT
 * checkUserEvent
 */
export const checkUserEvent = catchAsync(async (req, res, next) => {
  // - 1 Check reset history
  const event = await UserEvent.findOne({
    event: "email_activation_request",
    IP: req.ip,
    timestamp: {
      $gt: Date.now() - 15 * 60 * 1000
    }
  });

  // -  2 throw error if active
  if (event) {
    return next(
      new AppError(
        "You must wait 15 minutes before sending another email activation request.",
        403
      )
    );
  }

  // - 3 next()
  next();
});
