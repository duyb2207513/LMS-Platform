import { Router } from "express"; import { authenticate } from "../../common/middlewares/authenticate.js"; import { authorize } from "../../common/middlewares/authorize.js"; import { asyncHandler } from "../../common/utils/asyncHandler.js"; import { byCourseController, earningsController, overviewController, payoutsController } from "./earning.controller.js";
const router = Router(); router.use(authenticate, authorize("INSTRUCTOR"));
/**
 * @openapi
 * /instructor/revenue/overview:
 *   get: { summary: Get authenticated instructor revenue KPIs, tags: [Instructor revenue], security: [{ bearerAuth: [] }], responses: { 200: { description: Revenue overview } } }
 * /instructor/revenue/earnings:
 *   get: { summary: Get authenticated instructor earning history, tags: [Instructor revenue], security: [{ bearerAuth: [] }], responses: { 200: { description: Paginated earnings } } }
 * /instructor/revenue/by-course:
 *   get: { summary: Get authenticated instructor revenue grouped by course, tags: [Instructor revenue], security: [{ bearerAuth: [] }], responses: { 200: { description: Revenue by course } } }
 * /instructor/payouts:
 *   get: { summary: Get authenticated instructor payout history, tags: [Instructor revenue], security: [{ bearerAuth: [] }], responses: { 200: { description: Paginated payouts } } }
 */
router.get("/revenue/overview", asyncHandler(overviewController)); router.get("/revenue/earnings", asyncHandler(earningsController)); router.get("/revenue/by-course", asyncHandler(byCourseController)); router.get("/payouts", asyncHandler(payoutsController)); export default router;
