import { beforeEach, describe, expect, it, vi } from "vitest";

const { orderFindFirst, invoiceFindFirst, conversationFindUnique, messageFindMany } = vi.hoisted(() => ({
  orderFindFirst: vi.fn(),
  invoiceFindFirst: vi.fn(),
  conversationFindUnique: vi.fn(),
  messageFindMany: vi.fn(),
}));

vi.mock("../db/client.js", () => ({
  prisma: {
    order: { findFirst: orderFindFirst },
    invoice: { findFirst: invoiceFindFirst },
    conversation: { findUnique: conversationFindUnique },
    message: { findMany: messageFindMany },
  },
}));

import { NotFoundError } from "../lib/errors.js";
import { billingService } from "./billing.service.js";
import { conversationService } from "./conversation.service.js";
import { orderService } from "./order.service.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("customer-scoped order access", () => {
  it("queries order details using both the authenticated user and order number", async () => {
    orderFindFirst.mockResolvedValue(null);

    await expect(orderService.getByOrderNumber("user-1", "ORD-1001")).rejects.toThrow(
      NotFoundError,
    );

    expect(orderFindFirst).toHaveBeenCalledWith({
      where: { orderNumber: "ORD-1001", userId: "user-1" },
      include: { items: true, shipments: true },
    });
  });

  it("queries delivery status using both the authenticated user and order number", async () => {
    orderFindFirst.mockResolvedValue(null);

    await expect(orderService.getDeliveryStatus("user-2", "ORD-1002")).rejects.toThrow(
      NotFoundError,
    );

    expect(orderFindFirst).toHaveBeenCalledWith({
      where: { orderNumber: "ORD-1002", userId: "user-2" },
      include: { shipments: true },
    });
  });
});

describe("customer-scoped billing access", () => {
  it("queries invoice details using both the authenticated user and invoice number", async () => {
    invoiceFindFirst.mockResolvedValue(null);

    await expect(billingService.getInvoiceByNumber("user-1", "INV-2001")).rejects.toThrow(
      NotFoundError,
    );

    expect(invoiceFindFirst).toHaveBeenCalledWith({
      where: { invoiceNumber: "INV-2001", userId: "user-1" },
      include: { refunds: true },
    });
  });

  it("queries refund status using both the authenticated user and invoice number", async () => {
    invoiceFindFirst.mockResolvedValue(null);

    await expect(billingService.getRefundStatus("user-2", "INV-2002")).rejects.toThrow(
      NotFoundError,
    );

    expect(invoiceFindFirst).toHaveBeenCalledWith({
      where: { invoiceNumber: "INV-2002", userId: "user-2" },
      include: { refunds: true },
    });
  });
});

describe("customer-scoped conversation access", () => {
  it("checks ownership before returning recent messages", async () => {
    conversationFindUnique.mockResolvedValue(null);

    await expect(
      conversationService.getRecentMessages("conversation-1", "user-1", 5),
    ).rejects.toThrow(NotFoundError);

    expect(conversationFindUnique).toHaveBeenCalledWith({
      where: { id: "conversation-1", userId: "user-1" },
      select: { id: true },
    });
    expect(messageFindMany).not.toHaveBeenCalled();
  });

  it("checks ownership before appending a message", async () => {
    conversationFindUnique.mockResolvedValue(null);

    await expect(
      conversationService.addMessage("conversation-1", "user-2", {
        role: "user",
        content: "unauthorized message",
      }),
    ).rejects.toThrow(NotFoundError);

    expect(conversationFindUnique).toHaveBeenCalledWith({
      where: { id: "conversation-1", userId: "user-2" },
    });
  });
});
