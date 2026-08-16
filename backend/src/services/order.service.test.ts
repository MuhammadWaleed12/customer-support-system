import { describe, expect, it } from "vitest";
import { orderService } from "./order.service.js";
import { NotFoundError } from "../lib/errors.js";

describe("orderService.getByOrderNumber", () => {
  it("returns full order details with items and shipment for a delivered order", async () => {
    const order = await orderService.getByOrderNumber("ORD-1004");

    expect(order.orderNumber).toBe("ORD-1004");
    expect(order.status).toBe("delivered");
    expect(typeof order.total).toBe("number");
    expect(order.total).toBeCloseTo(59.99);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.productName).toBe("USB-C Hub");
    expect(order.shipments).toHaveLength(1);
    expect(order.shipments[0]?.status).toBe("delivered");
  });

  it("returns an order with no shipments for a pending order", async () => {
    const order = await orderService.getByOrderNumber("ORD-1001");

    expect(order.status).toBe("pending");
    expect(order.shipments).toHaveLength(0);
  });

  it("throws NotFoundError for an unknown order number", async () => {
    await expect(orderService.getByOrderNumber("ORD-9999")).rejects.toThrow(NotFoundError);
  });
});

describe("orderService.getDeliveryStatus", () => {
  it("surfaces a shipment exception status", async () => {
    const status = await orderService.getDeliveryStatus("ORD-1007");

    expect(status.orderStatus).toBe("shipped");
    expect(status.shipments).toHaveLength(1);
    expect(status.shipments[0]?.status).toBe("exception");
  });

  it("throws NotFoundError for an unknown order number", async () => {
    await expect(orderService.getDeliveryStatus("ORD-9999")).rejects.toThrow(NotFoundError);
  });
});
