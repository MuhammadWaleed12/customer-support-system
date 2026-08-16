import type { InvoiceStatus, RefundStatus } from "@prisma/client";
import { prisma } from "../db/client.js";
import { NotFoundError } from "../lib/errors.js";

export interface RefundDetails {
  amount: number;
  status: RefundStatus;
  reason: string | null;
  requestedAt: Date;
  completedAt: Date | null;
}

export interface InvoiceDetails {
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: Date;
  paidAt: Date | null;
  refunds: RefundDetails[];
}

export interface RefundStatusResult {
  invoiceNumber: string;
  invoiceStatus: InvoiceStatus;
  refunds: RefundDetails[];
}

function toRefundDetails(refund: {
  amount: { toNumber(): number };
  status: RefundStatus;
  reason: string | null;
  requestedAt: Date;
  completedAt: Date | null;
}): RefundDetails {
  return {
    amount: refund.amount.toNumber(),
    status: refund.status,
    reason: refund.reason,
    requestedAt: refund.requestedAt,
    completedAt: refund.completedAt,
  };
}

export const billingService = {
  async getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceDetails> {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: { refunds: true },
    });

    if (!invoice) {
      throw new NotFoundError(`No invoice found with number ${invoiceNumber}`);
    }

    return {
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount.toNumber(),
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      paidAt: invoice.paidAt,
      refunds: invoice.refunds.map(toRefundDetails),
    };
  },

  async getRefundStatus(invoiceNumber: string): Promise<RefundStatusResult> {
    const invoice = await prisma.invoice.findUnique({
      where: { invoiceNumber },
      include: { refunds: true },
    });

    if (!invoice) {
      throw new NotFoundError(`No invoice found with number ${invoiceNumber}`);
    }

    return {
      invoiceNumber: invoice.invoiceNumber,
      invoiceStatus: invoice.status,
      refunds: invoice.refunds.map(toRefundDetails),
    };
  },
};
