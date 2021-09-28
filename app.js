import path from "path";
import express from 'express';
import morgan from "morgan";
import helmet from "helmet";
import xss from "xss-clean";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";

// IMPORTS  ROUTES
import AppError from "./utils/appError.js";
import globalErrorHandler from "./utils/errors.js";

const app = express();

app.enable("trust proxy");

const __dirname = path.resolve();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// GLOBAL MIDDLEWARE

// Implement CORS
app.use(cors());
// ALLow-Control-Allow-Origin *
app.options("*", cors());

// GLOBAL VARIABLES

// Serving static files
// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// SECURE HTTP
app.use(helmet());

// Development logging
if (process.env.MODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());


// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

app.use(compression());

// middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// global error handler
app.use(globalErrorHandler);

export default app;