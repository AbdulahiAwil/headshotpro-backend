import { Router } from "express";

import AuthRouter from "./auth.route";
import paymentRouter from "./payment.route";
import HeadshotRouter from "./headshot.route";
import adminUserRoute from "./admin.user.routes";
import AdminOrderRouter from "./admin.order.routes";

const router = Router();
router.use('/auth', AuthRouter);
router.use('/payment', paymentRouter);
router.use('/headshots', HeadshotRouter);
router.use('/admin/users', adminUserRoute)
router.use('/admin/orders', AdminOrderRouter);

export default router;