
import cors from "cors";
import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth";
import hikerRoutes from "./routes/hikers";
import positionRoutes from "./routes/position";
import { startDeviceMonitor } from "./services/device-monitor";
const app = express();
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://hikermap.vercel.app",
    ],
    allowedHeaders: [
      "Content-Type",
      "ngrok-skip-browser-warning",
    ],
    methods: ["GET", "POST", "OPTIONS"],
  })
);

app.use(express.json({ limit: "10kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/hikers", hikerRoutes);
app.use("/api/positions", positionRoutes);

// Error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  res.status(500).json({
    message: "Terjadi kesalahan pada server",
  });
});

const port = Number(process.env.PORT || 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`HikerMap API berjalan pada port ${port}`);

  startDeviceMonitor();
});