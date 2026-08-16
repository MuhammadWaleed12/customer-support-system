import type { OrderStatus, ShipmentStatus } from "@prisma/client";
import { prisma } from "../db/client.js";
import { NotFoundError } from "../lib/errors.js";

export interface OrderItemDetails {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface ShipmentDetails {
  carrier: string;
  trackingNumber: string;
  status: ShipmentStatus;
  estimatedDelivery: string | null;
}

export interface OrderDetails {
  orderNumber: string;
  status: OrderStatus;
  total: number;
  placedAt: string;
  items: OrderItemDetails[];
  shipments: ShipmentDetails[];
}

export interface DeliveryStatus {
  orderNumber: string;
  orderStatus: OrderStatus;
  shipments: ShipmentDetails[];
}

function toShipmentDetails(shipment: {
  carrier: string;
  trackingNumber: string;
  status: ShipmentStatus;
  estimatedDelivery: Date | null;
}): ShipmentDetails {
  return {
    carrier: shipment.carrier,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    estimatedDelivery: shipment.estimatedDelivery?.toISOString() ?? null,
  };
}

export const orderService = {
  async getByOrderNumber(orderNumber: string): Promise<OrderDetails> {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true, shipments: true },
    });

    if (!order) {
      throw new NotFoundError(`No order found with number ${orderNumber}`);
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total.toNumber(),
      placedAt: order.placedAt.toISOString(),
      items: order.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
      })),
      shipments: order.shipments.map(toShipmentDetails),
    };
  },

  async getDeliveryStatus(orderNumber: string): Promise<DeliveryStatus> {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { shipments: true },
    });

    if (!order) {
      throw new NotFoundError(`No order found with number ${orderNumber}`);
    }

    return {
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      shipments: order.shipments.map(toShipmentDetails),
    };
  },
};
