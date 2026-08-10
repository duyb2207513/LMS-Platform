import type { Request, Response } from "express"; import { sendSuccess } from "../../common/utils/response.js"; import { cancelOrder, createOrder, getOrder, listMyOrders } from "./orders.service.js"; import type { CreateOrderInput } from "./orders.types.js";
const id = (request: Request) => String(request.params.orderId ?? "");
export async function createOrderController(request: Request, response: Response) { sendSuccess(response, 201, "Order created successfully", await createOrder(request.auth.userId, request.body as CreateOrderInput)); }
export async function listMyOrdersController(request: Request, response: Response) { sendSuccess(response, 200, "Orders retrieved successfully", await listMyOrders(request.auth.userId)); }
export async function getOrderController(request: Request, response: Response) { sendSuccess(response, 200, "Order retrieved successfully", await getOrder(id(request), request.auth.userId, request.auth.role === "ADMIN")); }
export async function cancelOrderController(request: Request, response: Response) { await cancelOrder(id(request), request.auth.userId); response.status(204).send(); }
