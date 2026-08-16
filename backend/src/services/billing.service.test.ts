import { describe, expect, it } from "vitest";
import { billingService } from "./billing.service.js";
import { NotFoundError } from "../lib/errors.js";

describe("billingService.getInvoiceByNumber", () => {
  it("returns a paid invoice with a mid-flight refund", async () => {
    const invoice = await billingService.getInvoiceByNumber("INV-2001");

    expect(invoice.status).toBe("paid");
    expect(typeof invoice.amount).toBe("number");
    expect(invoice.amount).toBeCloseTo(59.99);
    expect(invoice.refunds).toHaveLength(1);
    expect(invoice.refunds[0]?.status).toBe("processing");
    expect(typeof invoice.refunds[0]?.amount).toBe("number");
  });

  it("returns a draft invoice with no refunds", async () => {
    const invoice = await billingService.getInvoiceByNumber("INV-2004");

    expect(invoice.status).toBe("draft");
    expect(invoice.refunds).toHaveLength(0);
  });

  it("throws NotFoundError for an unknown invoice number", async () => {
    await expect(billingService.getInvoiceByNumber("INV-9999")).rejects.toThrow(NotFoundError);
  });
});

describe("billingService.getRefundStatus", () => {
  it("returns an approved mid-flight refund", async () => {
    const result = await billingService.getRefundStatus("INV-2002");

    expect(result.invoiceStatus).toBe("paid");
    expect(result.refunds).toHaveLength(1);
    expect(result.refunds[0]?.status).toBe("approved");
  });

  it("throws NotFoundError for an unknown invoice number", async () => {
    await expect(billingService.getRefundStatus("INV-9999")).rejects.toThrow(NotFoundError);
  });
});
