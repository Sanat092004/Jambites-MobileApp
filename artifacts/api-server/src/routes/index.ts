import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jambitesRouter from "./jambites";
import anthropicRouter from "./anthropic";

const router: IRouter = Router();

router.use(healthRouter);
router.use(jambitesRouter);
router.use(anthropicRouter);

export default router;
