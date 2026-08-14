import { Router } from "express"; import { authenticate } from "../../common/middlewares/authenticate.js"; import { authorize } from "../../common/middlewares/authorize.js"; import { validateRequest } from "../../common/middlewares/validateRequest.js"; import { asyncHandler } from "../../common/utils/asyncHandler.js"; import { balancesController, createController, listController, processController } from "./payout.controller.js"; import { validateCreatePayout, validateProcessPayout } from "./payout.validation.js";
const router = Router(); router.use(authenticate, authorize("ADMIN"));
/**
 * @openapi
 * /admin/payouts:
 *   get: { summary: List sandbox payouts, tags: [Admin payouts], security: [{ bearerAuth: [] }], responses: { 200: { description: Paginated payouts } } }
 *   post: { summary: Create an idempotent payout from available earnings, tags: [Admin payouts], security: [{ bearerAuth: [] }], parameters: [{ in: header, name: Idempotency-Key, required: true, schema: { type: string } }], requestBody: { required: true, content: { application/json: { schema: { type: object, required: [instructorId], properties: { instructorId: { type: string, format: uuid }, earningIds: { type: array, items: { type: string, format: uuid } } } } } } }, responses: { 201: { description: Payout created }, 409: { description: No available earnings } } }
 * /admin/payouts/balances:
 *   get: { summary: List available balances by instructor, tags: [Admin payouts], security: [{ bearerAuth: [] }], responses: { 200: { description: Instructor balances } } }
 * /admin/payouts/{id}/process:
 *   post: { summary: Process a payout in the sandbox, tags: [Admin payouts], security: [{ bearerAuth: [] }], requestBody: { content: { application/json: { schema: { type: object, properties: { succeed: { type: boolean, default: true } } } } } }, responses: { 200: { description: Payout processed } } }
 */
router.get("/balances", asyncHandler(balancesController)); router.get("/", asyncHandler(listController)); router.post("/", validateRequest(validateCreatePayout), asyncHandler(createController)); router.post("/:id/process", validateRequest(validateProcessPayout), asyncHandler(processController)); export default router;
