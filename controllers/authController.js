import User from "../models/userModel.js";
// import Jwt from "jsonwebtoken";
// import { promisify } from "util";
// import sendEmail from "../utils/email.js";
// import crypto from "crypto";
import admin from "../firebase/firebase.js";

import { catchAsync } from "../utils/catchAsync.js";
// import AppError from "../utils/appError.js";

// const signToken = (id) => {
//   return Jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN,
//   });
// };

// const createSendToken = (user, statusCode, res) => {
//   const token = signToken(user._id);
//   const cookieOptions = {
//     expires: new Date(
//       Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//   };
//   if (process.env.NODE_ENV === "development") cookieOptions.secure = false;

//   res.cookie("token", token, cookieOptions);

//   //Remove password from output
//   user.password = undefined;

//   res.status(statusCode).json({
//     success: true,
//     token,
//     user,
//   });
// };

export const authenticate = catchAsync(async (req, res, next) => {

  const firebaseUser = await admin.auth().verifyIdToken(req.headers.token);
  // console.log("FireBase Header Token", firebaseUser);

  const user = await User.findOne({ email: firebaseUser.email });

  if (user) {
    // console.log(user, "===== found user");
    req.currentUser = user;
    next();
  } else {
    const newUser = await User.create({
      fullname: firebaseUser.displayName,
      email: firebaseUser.email,
    });
    req.currentUser = newUser;
  }
});

export const sendUser = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.currentUser,
  });
};

export const restrictedRoute =(req, res) => {
  if (!req.currentUser) {
    res.json({ login: false, admin: false });
  } 
  
  if (req.currentUser.role === 'user') {
    res.json({ admin: false });
  }else {
    res.json({ admin: true });
  }
}

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'editor']. role='user'
    if (!roles.includes(req.currentUser.role)) {
      res
        .status(403)
        .send({ message: "You do not have permission to perform this action" });
    }

    next();
  };
};

export const privateRoute = async (req, res, next) => {
  // console.log("FireBase Private route Header Token", req.headers.token);
  if (req.currentUser) {
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
};

// export const signup = catchAsync(async (req, res, next) => {
//   const { fullname, email, password } = req.body;

//   const newUser = await User.create({
//     fullname,
//     email,
//     password,
//   });

//   createSendToken(newUser, 200, res);
// });

// export const signin = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return next(new AppError("Please provide email and password", 400));
//   }

//   const user = await User.findOne({ email }).select("+password");

//   if (!user || !(await user.correctPassword(password))) {
//     return next(new AppError("Incorrect email or password", 401));
//   }

//   createSendToken(user, 200, res);
// });

// export const signout = (req, res) => {
//   res.clearCookie("token");
//   res.json({
//     message: "Signout success",
//   });
// };

// export const protect = catchAsync(async (req, res, next) => {
//   let token;
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   }
//   // CHECK FOR TOKEN
//   if (!token) {
//     return next(
//       new AppError("You are not logged in, Please login to get access", 401)
//     );
//   }

//   //VERIFY TOKEN
//   const decoded = await promisify(Jwt.verify)(token, process.env.JWT_SECRET);

//   //CHECK IF USER HAS NOT BEEN DELETED
//   const currentUser = await User.findById(decoded.id);

//   if (!currentUser) {
//     return next(new AppError("User no longer exist", 404));
//   }

//   //CHECK IF USER CHANGED PASSWORD AFTER TOKEN WAS ISSUED
//   if (currentUser.passwordChangedAfter(decoded.iat)) {
//     return next(
//       new AppError("Password was changed recently, Please login again", 401)
//     );
//   }

//   //GRANT ACCESS TO PROTECTED ROUTE
//   req.user = currentUser;
//   next();
// });



// export const forgotPassword = catchAsync(async (req, res, next) => {
//   // 1) Get user based on POSTed email
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) {
//     return next(new AppError("Email could not be sent.", 404));
//   }

//   // 2) Generate the random reset token
//   const resetToken = user.getResetPasswordToken();
//   await user.save({ validateBeforeSave: false });

//   // 3) Send it to user's email
//   const resetURL = `${req.protocol}://${req.get(
//     "host"
//   )}/api/v1/users/reset-password/${resetToken}`;

//   const message = `
//   <h1>You requested a password reset</h1>
//   <p>Please go to this link to <a href=${resetURL} clicktracking=off>reset your password</a>. If you didn’t request this you can safely ignore this email.</p>
//   <a href=${resetURL} clicktracking=off>${resetURL}</a>
// `;

//   try {
//     await sendEmail({
//       to: user.email,
//       subject: "Password Reset Request (valid for 10 min)",
//       text: message,
//     });

//     res.status(200).json({
//       success: true,
//       message: "Email Sent!",
//     });
//   } catch (err) {
//     user.passwordResetToken = undefined;
//     user.passwordResetExpires = undefined;

//     await user.save({ validateBeforeSave: false });

//     return next(
//       new AppError(
//         "There was an error sending the email. Try again later!",
//         500
//       )
//     );
//   }
// });

// export const resetPassword = catchAsync(async (req, res, next) => {
//   // 1) Get user based on the token
//   const hashedToken = crypto
//     .createHash("sha256")
//     .update(req.params.token)
//     .digest("hex");

//   const user = await User.findOne({
//     passwordResetToken: hashedToken,
//     passwordResetExpires: { $gt: Date.now() },
//   });

//   // 2) If token has not expired, and there is user, set the new password
//   if (!user) {
//     return next(new AppError("Token is invalid or has expired", 400));
//   }
//   user.password = req.body.password;
//   user.passwordConfirm = req.body.passwordConfirm;
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;
//   await user.save();

//   // 3) Update changedPasswordAt property for the user
//   // 4) Log the user in, send JWT
//   createSendToken(user, 200, res);
// });

// export const updatePassword = catchAsync(async (req, res, next) => {
//   // 1) Get user from collection
//   const user = await User.findById(req.user.id).select("+password");

//   // 2) Check if POSTed current password is correct
//   if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
//     return next(new AppError("Your current password is wrong.", 401));
//   }

//   // 3) If so, update password
//   user.password = req.body.password;
//   user.passwordConfirm = req.body.passwordConfirm;
//   await user.save();
//   // User.findByIdAndUpdate will NOT work as intended!

//   // 4) Log user in, send JWT
//   createSendToken(user, 200, res);
// });
