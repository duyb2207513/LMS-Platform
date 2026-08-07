import cors from "cors";
import express from "express";
import apiRouter from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", apiRouter);

app.use((_request, response) => {
  response.status(404).json({
    success: false,
    message: "API endpoint not found"
  });
});

export default app;