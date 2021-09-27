const jwt = require("jsonwebtoken"),
  crypto = require("crypto"),
  User = require("../users/user.model"),
  AppError = require("../_utils/appError"),
  Role = require("../_helpers/role"),
  Email = require("../_utils/email");

import {
  getModel,
  passport as _passport,
  Controller,
  addController,
} from "../core";

import { createClient } from "redis";
import Promise from "bluebird";
import jwt from "jsonwebtoken";
import UserAgent from "user-agents";
import { randomBytes, createHash } from "crypto";

import { randomBytes } from "crypto";
import CatchAsync from "../utils";
import AppError from "../utils/appError.js";

const Queue = createClient();
const User = getModel("User");
const LoginAttempt = getModel("LoginAttempt");
const PasswordReset = getModel("PasswordReset");
const ResetLog = getModel("ResetLog");
const UserEvent = getModel("UserEvent");

const passport = _passport;

/**
 * Converts date in milliseconds to MySQL datetime format
 * @param: ts - date in milliseconds
 * @returns: MySQL datetime
 */
function datetime(ts) {
  return new Date(ts).toISOString().slice(0, 19).replace("T", " ");
}

const signToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};

const createSendToken = (user, statuscode, req, res) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-for"] === "https",
  });

  // Remove the password from the output
  user.password = undefined;

  res.status(statuscode).json({
    status: "success",
    token,
    data: user,
  });
};

const AuthController = Controller.extend({
  login: CatchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1 ) Check if email and passwordConfirm exist
    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    // 2 ) Check if user exist && password is correct
    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    // incase of an account not verified
    const verifyMSg = `You must activate your account before you can login. To proceed please <a href='${
      req.protocol
    }://${req.get("host")}/api/v1/auth/resend/${encodeURI(
      user.email
    )}'>Click here</a> to resend activation code to your email address.`;

    // 3) Make sure the user has been verified
    if (!user.isVerified) {
      return next(new AppError(verifyMSg, 401));
    }

    // 4 ) If everything ok send token to client
    createSendToken(user, 200, req, res);
  }),

  /**
   * Register a new user account
   */
  register: CatchAsync(async (req, res, next) => {
    const { email } = req.body;

    // check email already used
    const checkEmail = await User.findOne({ email: email });

    if (checkEmail) {
      return next(new AppError(`Email ${email} is already registered`, 400));
    }

    // create verification token
    const verificationToken = randomBytes(32).toString("hex");

    // save user
    const newUser = await User.forge({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      verificationToken: createHash("sha256")
        .update(verificationToken)
        .digest("hex"),
      verificationExpires: Date.now() + 10 * 60 * 1000,
      role_id: 1,
      updated_by: 1,
    }).save();

    // send account verification
    const verifyURL = `${req.protocol}://${req.get(
      "host"
    )}/auth/verifyEmail?token=${verificationToken}`;

    Queue.publish(
      "email",
      JSON.stringify({
        type: "registration",
        to: newUser.toJSON(),
      })
    );

    // - save user event
    await UserEvent.forge({
      IP: req.ip,
      event: "email_activation_request",
      timestamp: Date.now(),
    }).save();

    res.status(201).json({
      status: "success",
      message:
        "A verification email has been sent to " +
        newUser.email +
        ". Check your inbox",
      data: newUser,
    });
  }),

  forgotPassword: CatchAsync(async (req, res, next) => {
    req.assert("email", "Please enter a valid email address.").isEmail();

    let errors = req.validationErrors();
    let user;

    if (errors) {
      req.flash("errors", errors);
      return res.redirect("/forgot");
    }

    User.forge({ email: req.body.email })
      .fetch({ require: true })
      .then(function (userModel) {
        user = userModel;

        return new Promise(function (resolve, reject) {
          randomBytes(16, function (err, buf) {
            if (err) {
              reject(err);
            } else {
              resolve(buf.toString("hex"));
            }
          });
        });
      })
      .then(function (token) {
        return user.save({
          resetPasswordToken: token,
          resetPasswordExpires: datetime(Date.now() + 3600000),
        });
      })
      .then(function (userModel) {
        Queue.publish(
          "email",
          JSON.stringify({
            type: "reset",
            to: userModel.toJSON(),
          })
        );
      })
      .then(function (resp) {
        req.flash("info", {
          msg:
            "An e-mail has been sent to " +
            user.get("email") +
            " with further instructions.",
        });
        res.redirect("/forgot");
      })
      .catch(function (error) {
        req.flash("errors", { msg: "Error occured" });
        res.redirect("back");
      });
  }),

  resetPassword: CatchAsync(async (req, res, next) => {
    req
      .assert("password", "Password must be at least 6 characters long.")
      .len(6);
    req.assert("confirm", "Passwords must match.").equals(req.body.password);

    let errors = req.validationErrors();

    if (errors) {
      req.flash("errors", errors);
      return res.redirect("back");
    }

    try {
      let user = await User.forge()
        .query(function (qb) {
          return qb
            .where("resetPasswordToken", "=", req.params.token)
            .andWhere("resetPasswordExpires", ">", datetime(Date.now()));
        })
        .fetch();

      user = await user.save({
        password: req.body.password,
        resetPasswordToken: "",
      });

      Queue.publish(
        "email",
        JSON.stringify({
          type: "password-changed",
          to: user.toJSON(),
        })
      );

      req.logIn(user, function (err) {
        req.flash("success", { msg: "Your account has been updated" });
        res.redirect("/");
      });
    } catch (error) {
      console.error(error);
      req.flash("error", { msg: "An error has occured, account not updated." });
      res.redirect("back");
    }
  }),

  verifyEmail: CatchAsync(async (req, res, next) => {
    // 1) Get user based Token
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.body.token)
      .digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationExpires: {
        $gt: Date.now(),
      },
    });

    // 2) If toke has not expired, and there is user, set the new password
    if (!user) {
      return next(
        new AppError(
          "Verification failed Or Token has invalid or has expired",
          400
        )
      );
    }

    // Verify and save the user
    user.isVerified = true;
    user.verifiedDate = Date.now();
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // verified email
    const url = `${req.protocol}://${req.get("host")}/`;
    await new Email(user, url).sendEmailVerified();

    res.status(200).json({
      status: "success",
      message:
        "Your account has been verified. You can now log in to use your account.",
    });
  }),

  resendVerifyEmailLink: CatchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({
      email: req.params.email,
    });

    if (!user) {
      return next(
        new AppError("There is no user with the given email address.", 404)
      );
    }

    // 2) check if account is not verified already
    if (user.isVerified) {
      return next(
        new AppError("This account has already been verified. Please log in.")
      );
    }

    // 3) Create a verification token, save it, and send email
    const token = user.createAccountVerificationToken();

    await user.save({
      validateBeforeSave: false,
    });

    // 4) Send it to user's email
    try {
      const resetURL = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/auth/verify-email/?token=${token}`;

      await new Email(user, resetURL).sendAccountVerification();

      res.status(200).json({
        status: "success",
        message: "A verification email has been sent to " + user.email + ".",
      });
    } catch (error) {
      user.verificationToken = undefined;
      user.verificationExpires = undefined;

      await user.save({
        validateBeforeSave: false,
      });

      return next(
        new AppError(
          "There was an error sending the email! Try again later.",
          500
        )
      );
    }
  }),

  logout: CatchAsync(async (req, res, next) => {
    res.cookie("jwt", "loggedout", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });
    res.status(200).json({
      status: "success",
    });
  }),
});

export default addController("AuthController", AuthController);
