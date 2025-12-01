import "dotenv/config.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.routes.js";
import studentsRoutes from "./routes/students.routes.js";
import recordsRoutes from "./routes/records.routes.js";
import certificatesRoutes from "./routes/certificates.routes.js";
import verifyRoutes from "./routes/verify.routes.js";
import ipfsRoutes from "./routes/ipfs.routes.js";
import zkpRoutes from "./routes/zkp.routes.js";
import multisigRoutes from "./routes/multisig.routes.js";

await connectDB();

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/certificates", certificatesRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/ipfs", ipfsRoutes);
app.use("/api/zkp", zkpRoutes);
app.use("/api/multisig", multisigRoutes);

app.use((req, res) => res.status(404).json({ message: "Not found" }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API running at http://localhost:${port}`));
