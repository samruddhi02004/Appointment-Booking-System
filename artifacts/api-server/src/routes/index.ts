import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import businessesRouter from "./businesses";
import appointmentsRouter from "./appointments";
import slotsRouter from "./slots";
import bookingsRouter from "./bookings";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(businessesRouter);
router.use(appointmentsRouter);
router.use(slotsRouter);
router.use(bookingsRouter);
router.use(usersRouter);
router.use(dashboardRouter);

export default router;
