import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import AppError from "./utils/appError.js";
import { userRouter } from "./routes/userRoutes.js";
import { postRouter } from "./routes/postRoutes.js";
import { tagRouter } from "./routes/tagRoutes.js";

import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import { globalErrorHandler } from "./controllers/errorController.js";
import { getRelatedPosts } from "./controllers/postController.js";

const app = express();

//cors
app.use(cors());

app.use(helmet());

// Limit requests from same API
const limiter = rateLimit({
  max: 100000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

app.use(morgan("dev"));

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ["duration"],
  })
);

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);

  next();
});


app.use("/api/posts", postRouter);
app.use("/api/users", userRouter);
app.use("/api/tags", tagRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server`, 400));
});

app.use(globalErrorHandler);

export default app;
