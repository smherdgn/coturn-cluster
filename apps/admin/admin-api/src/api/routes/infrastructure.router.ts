import { Router } from "express";
import * as controller from "../controllers/infrastructure.controller";

// for database redis and monitoring
const asyncHandler =
  (fn: (req: any, res: any, next: any) => Promise<any>) =>
  (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const createInfrastructureRouter = (): Router => {
  const router = Router();

  router.get(
    "/database/status",
    asyncHandler(async (req, res) => {
      const status = await controller.getDatabaseStatus();
      res.json(status);
    })
  );

  router.get(
    "/redis/status",
    asyncHandler(async (req, res) => {
      const status = await controller.getRedisStatus();
      res.json(status);
    })
  );

  return router;
};
