import { Router, Request, Response, NextFunction } from "express";
import { PubSubBroker } from "../../pubsub/broker";
import * as controller from "../controllers/node.controller";

export const createNodeRouter = (broker: PubSubBroker): Router => {
  const router = Router();

  const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
    (req: Request, res: Response, next: NextFunction) =>
      Promise.resolve(fn(req, res, next)).catch(next);

  router.get("/", (req, res) => {
    res.json(controller.listNodes(broker));
  });

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const result = await controller.createNode(broker, req.body);
      res.status(201).json(result);
    })
  );

  router.delete(
    "/:nodeId",
    asyncHandler(async (req, res) => {
      const result = await controller.deleteNode(req.params.nodeId);
      res.json(result);
    })
  );

  router.post(
    "/:nodeId/restart",
    asyncHandler(async (req, res) => {
      const result = await controller.restartNode(req.params.nodeId);
      res.json(result);
    })
  );

  router.get(
    "/:nodeId/logs",
    asyncHandler(async (req, res) => {
      try {
        const logs = await controller.getNodeLogs(req.params.nodeId);
        res.setHeader("Content-Type", "text/plain");
        res.send(logs);
      } catch (error: any) {
        if (error.message.includes("Pod not found")) {
          return res.status(404).json({ error: "Pod not found" });
        }
        res
          .status(500)
          .json({ error: "Failed to get logs", detail: error.message });
      }
    })
  );

  return router;
};
