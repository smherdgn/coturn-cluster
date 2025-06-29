import { Router } from "express";
import { PubSubBroker } from "../../pubsub/broker";
import { createNodeRouter } from "./nodes.router";
import { createStatusRouter } from "./status.router";
import { createMonitoringRouter } from "./monitoring.router";
import { createUserRouter } from "./users.router";
import { createConfigRouter } from "./config.router";
import { createInfrastructureRouter } from "./infrastructure.router";

export const createApiRouter = (broker: PubSubBroker): Router => {
  const router = Router();

  router.use("/nodes", createNodeRouter(broker));
  router.use("/users", createUserRouter());
  router.use("/config", createConfigRouter());
  router.use(createStatusRouter(broker));
  router.use(createMonitoringRouter(broker));
  router.use(createInfrastructureRouter());

  return router;
};
