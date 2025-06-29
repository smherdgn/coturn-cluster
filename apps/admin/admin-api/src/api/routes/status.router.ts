import { Router } from "express";
import { PubSubBroker } from "../../pubsub/broker";
import * as controller from "../controllers/status.controller";

export const createStatusRouter = (broker: PubSubBroker): Router => {
  const router = Router();

  router.get("/services", (req, res) => {
    res.json(controller.getServices(broker));
  });

  router.get("/debug", (req, res) => {
    res.json(controller.getDebugInfo(broker));
  });

  router.get("/k8s-dashboard-url", (req, res) => {
    res.json(controller.getK8sDashboardUrl());
  });

  return router;
};
