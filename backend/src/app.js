const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { CLIENT_URL } = require("./config/env");
const routes = require("./routes/index");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

// ─── Bảo mật HTTP Headers ─────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true, // cho phép gửi cookie
  }),
);

// ─── Request Parsing ──────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static Files ─────────────────────────────────────────────────────────────
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// ─── Logging (chỉ dev) ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 500,
  message: {
    success: false,
    message: "Quá nhiều request, vui lòng thử lại sau.",
  },
});
app.use("/api", limiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ success: true, message: "Server is running 🚀" });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api", routes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res
    .status(404)
    .json({
      success: false,
      message: `Route ${req.originalUrl} không tồn tại`,
    });
});

// ─── Global Error Handler (phải đặt cuối cùng) ───────────────────────────────
app.use(errorMiddleware);

module.exports = app;
