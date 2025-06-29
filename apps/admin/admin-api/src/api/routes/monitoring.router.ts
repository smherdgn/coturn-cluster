import { Router } from "express";
import { PubSubBroker } from "../../pubsub/broker";
import * as controller from "../controllers/monitoring.controller";

export const createMonitoringRouter = (broker: PubSubBroker): Router => {
  const router = Router();

  router.get("/nginx/status", (req, res) => {
    res.json(controller.getNginxStatus(broker));
  });

  router.get("/security/status", (req, res) => {
    res.json(controller.getSecurityStatus());
  });

  return router;
};
