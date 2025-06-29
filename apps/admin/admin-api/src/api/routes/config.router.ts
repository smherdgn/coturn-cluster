import { Router } from "express";
import * as controller from "../controllers/config.controller";

const asyncHandler =
  (fn: (req: any, res: any, next: any) => Promise<any>) =>
  (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const createConfigRouter = (): Router => {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const config = await controller.getConfig();
      res.json(config);
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const result = await controller.updateConfig(req.body);
      res.json(result);
    })
  );

  return router;
};
