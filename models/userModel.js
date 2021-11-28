import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { createUsername } from "../utils/createUsername.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      required: false,
      lowercase: true,
      unique: true,
      maxlength: 32,
      index: true,
    },
    fullname: { type: String, trim: true, required: false },

    email: {
      type: String,
      required:[true, 'Email is required'],
      lowercase: true,
      unique: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    profile: {type: String, required:false},
    bio: {type: String},
    // password: { type: String, required: true, select: false, minlength: [8, 'password is shorter than the minimum allowed length (8).']},
    // passwordConfirm: {
    //   type: String,
    //   required: true,
    //   validate: {
    //     validator: function (el) {
    //       return el === this.password;
    //     },
    //     message: "password does not match!",
    //   },
    // },
    // passwordChangedAt: { type: Date },
    // passwordResetToken: String,
    // passwordResetExpires: Date,
    role: {
      type: String,
      enum: ["user", "editor", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    avatar: {
      data: Buffer,
      contentType: String, 
      // type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// userSchema.pre("save", async function (next) {
//   //run if password is modified
//   if (!this.isModified("password")) return next();
//   //hash password
//   const salt = await bcrypt.genSalt(12);

//   this.password = await bcrypt.hash(this.password, salt);

//   //delete password confirm from db
//   this.passwordConfirm = undefined;
//   next();
// });

userSchema.pre("save", async function (next) {
  //run if email is modified
  if (!this.isModified("email")) return next();

  //extract email username
  const emailUsername = this.email.split("@")[0].replace(".", "-");

  //check if username exists
  const userNameExists = await createUsername(emailUsername);

  //generate username
  if (!userNameExists) {
    this.username = emailUsername;
  } else {
    this.username = emailUsername + crypto.randomBytes(2).toString("hex");
  }

  this.profile = `${process.env.CLIENT_URL}/account/${this.username}`

  next();
});

// userSchema.pre("save", function (next) {
//   if (!this.isModified("password") || this.isNew) return next();

//   this.passwordChangedAt = Date.now() - 1000;
//   next();
// });

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ isActive: { $ne: false } });
  next();
});

// userSchema.methods.correctPassword = async function (candidatePassword) {
//   return await bcrypt.compare(candidatePassword, this.password);
// };

// userSchema.methods.passwordChangedAfter = function (JWTTimestamp) {
//   if (this.passwordChangedAt) {
//     const changedTimestamp = parseInt(
//       this.passwordChangedAt.getTime() / 1000,
//       10
//     );

//     console.log(changedTimestamp, JWTTimestamp);
//     return JWTTimestamp < changedTimestamp;
//   }
//   return false;
// };

// userSchema.methods.getResetPasswordToken = function () {
//   const resetToken = crypto.randomBytes(32).toString("hex");

//   this.passwordResetToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");

//   console.log({ resetToken }, this.passwordResetToken);

//   this.passwordResetExpires = Date.now() + 70 * 60 * 1000;

//   return resetToken;
// };

const User = mongoose.model("User", userSchema);

export default User;
