import { z } from "zod";
import { createServiceTool } from "../lib/create-service-tool.js";
import { orderService } from "../../services/order.service.js";

export const fetchOrderDetails = createServiceTool({
  description:
    "Fetch full details for an order by its order number, including its status, total, line items, and any shipments. Use this when the customer asks about the contents, status, or cost of a specific order.",
  inputSchema: z.object({
    orderNumber: z.string().describe("The order number, e.g. ORD-1042"),
  }),
  execute: ({ orderNumber }) => orderService.getByOrderNumber(orderNumber),
});

export const checkDeliveryStatus = createServiceTool({
  description:
    "Check the shipping and delivery status for an order, including carrier, tracking number, and estimated delivery date. Use this when the customer asks where their order is or when it will arrive.",
  inputSchema: z.object({
    orderNumber: z.string().describe("The order number, e.g. ORD-1042"),
  }),
  execute: ({ orderNumber }) => orderService.getDeliveryStatus(orderNumber),
});
