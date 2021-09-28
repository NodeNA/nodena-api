import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

import LoginAttempt from "../models/login-attempt";

// - LOGIN PROTECT ROUTE
export const loginProtect = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  // - 1 Check login Attempts
  const loginAttempts = await LoginAttempt.findOne({
    username: email,
    IP: req.ip,
    timestamp: {
      $gt: Date.now() - 15 * 60 * 1000
    }
  });

  // - 2 check login attempts count limit to five
  if (loginAttempts) {
    if (loginAttempts.count >= 5)
      return next(
        new AppError(
          "You have attempted to login too many times! Please wait 15 minutes before trying again.",
          403
        )
      );
  }

  // - 3 next()
  next();
});
