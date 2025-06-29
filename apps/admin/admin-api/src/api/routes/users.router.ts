import { Router } from "express";
import * as controller from "../controllers/users.controller";

const asyncHandler =
  (fn: (req: any, res: any, next: any) => Promise<any>) =>
  (req: any, res: any, next: any) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export const createUserRouter = (): Router => {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const users = await controller.getAllUsers();
      res.json(users);
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const newUser = await controller.addUser(req.body);
      res.status(201).json(newUser);
    })
  );

  router.delete(
    "/:userId",
    asyncHandler(async (req, res) => {
      await controller.deleteUser(req.params.userId);
      res.status(204).send();
    })
  );

  return router;
};
