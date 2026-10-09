import { z } from "zod";
import { createServiceTool } from "../lib/create-service-tool.js";
import { billingService } from "../../services/billing.service.js";

export function createBillingTools(userId: string) {
  return {
    getInvoiceDetails: createServiceTool({
      description:
        "Fetch full details for an invoice by its invoice number, including amount, status, and any associated refunds. Use this when the customer asks about a charge, an invoice, or a payment.",
      inputSchema: z.object({
        invoiceNumber: z.string().describe("The invoice number, e.g. INV-2041"),
      }),
      execute: ({ invoiceNumber }) => billingService.getInvoiceByNumber(userId, invoiceNumber),
    }),
    checkRefundStatus: createServiceTool({
      description:
        "Check the status of any refunds tied to an invoice. Use this when the customer asks about the status of a refund they requested.",
      inputSchema: z.object({
        invoiceNumber: z.string().describe("The invoice number, e.g. INV-2041"),
      }),
      execute: ({ invoiceNumber }) => billingService.getRefundStatus(userId, invoiceNumber),
    }),
  };
}
