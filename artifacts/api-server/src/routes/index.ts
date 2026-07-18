import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import mlRouter from "./ml";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(mlRouter);
router.use(analyticsRouter);

export default router;
