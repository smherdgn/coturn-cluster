import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import { PubSubBroker } from "../pubsub/broker";
import { createApiRouter } from "./routes";

export class AdminAPIServer {
  private app: Application;

  constructor(private port: number, private pubsubBroker: PubSubBroker) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes() {
    this.app.get("/health", (req, res) => {
      res
        .status(200)
        .json({ status: "healthy", timestamp: new Date().toISOString() });
    });

    this.app.use("/api", createApiRouter(this.pubsubBroker));

    if (process.env.NODE_ENV === "production") {
      const uiBuildPath = path.resolve(
        __dirname,
        "../../../apps/admin-ui/dist"
      );
      this.app.use(express.static(uiBuildPath));
      this.app.get("*", (req, res) => {
        res.sendFile(path.join(uiBuildPath, "index.html"));
      });
    }
  }

  private setupErrorHandling() {
    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error("❌ Unhandled Error:", err);
        res.status(500).json({
          error: "An internal server error occurred",
          message: err.message,
        });
      }
    );
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(
          `📊 Admin API Server is running on http://localhost:${this.port}`
        );
        resolve();
      });
    });
  }
}
