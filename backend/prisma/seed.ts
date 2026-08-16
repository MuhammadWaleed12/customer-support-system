import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

// Shared demo password for all seeded users — this is a demo/assessment
// dataset, not real accounts, so one clearly-documented password is fine.
const DEMO_PASSWORD = "password123";

async function main() {
  // Wipe in FK-safe order (children before parents) so the script is re-runnable.
  await prisma.session.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.message.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.order.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = hashPassword(DEMO_PASSWORD);

  const alice = await prisma.user.create({
    data: { email: "alice@example.com", name: "Alice Chen", passwordHash },
  });
  const marcus = await prisma.user.create({
    data: { email: "marcus@example.com", name: "Marcus Johnson", passwordHash },
  });
  const priya = await prisma.user.create({
    data: { email: "priya@example.com", name: "Priya Patel", passwordHash },
  });

  const ord1001 = await prisma.order.create({
    data: {
      userId: alice.id,
      orderNumber: "ORD-1001",
      status: "pending",
      total: 89.97,
      items: {
        create: [{ productName: "Wireless Mouse", quantity: 3, unitPrice: 29.99 }],
      },
    },
  });

  const ord1002 = await prisma.order.create({
    data: {
      userId: alice.id,
      orderNumber: "ORD-1002",
      status: "processing",
      total: 129.99,
      items: {
        create: [{ productName: "Mechanical Keyboard", quantity: 1, unitPrice: 129.99 }],
      },
    },
  });

  const ord1003 = await prisma.order.create({
    data: {
      userId: alice.id,
      orderNumber: "ORD-1003",
      status: "shipped",
      total: 249.5,
      items: {
        create: [
          { productName: "27in Monitor", quantity: 1, unitPrice: 219.5 },
          { productName: "HDMI Cable", quantity: 3, unitPrice: 10.0 },
        ],
      },
      shipments: {
        create: [
          {
            carrier: "UPS",
            trackingNumber: "1Z999AA10123456784",
            status: "in_transit",
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  const ord1004 = await prisma.order.create({
    data: {
      userId: alice.id,
      orderNumber: "ORD-1004",
      status: "delivered",
      total: 59.99,
      items: {
        create: [{ productName: "USB-C Hub", quantity: 1, unitPrice: 59.99 }],
      },
      shipments: {
        create: [
          {
            carrier: "FedEx",
            trackingNumber: "784509621340",
            status: "delivered",
            estimatedDelivery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  const ord1005 = await prisma.order.create({
    data: {
      userId: marcus.id,
      orderNumber: "ORD-1005",
      status: "cancelled",
      total: 44.0,
      items: {
        create: [{ productName: "Phone Case", quantity: 2, unitPrice: 22.0 }],
      },
    },
  });

  const ord1006 = await prisma.order.create({
    data: {
      userId: marcus.id,
      orderNumber: "ORD-1006",
      status: "delivered",
      total: 349.0,
      items: {
        create: [{ productName: "Standing Desk Frame", quantity: 1, unitPrice: 349.0 }],
      },
      shipments: {
        create: [
          {
            carrier: "UPS",
            trackingNumber: "1Z999AA10198765432",
            status: "delivered",
            estimatedDelivery: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  const ord1007 = await prisma.order.create({
    data: {
      userId: priya.id,
      orderNumber: "ORD-1007",
      status: "shipped",
      total: 79.98,
      items: {
        create: [{ productName: "Desk Lamp", quantity: 2, unitPrice: 39.99 }],
      },
      shipments: {
        create: [
          {
            carrier: "USPS",
            trackingNumber: "9400111899560123456789",
            status: "exception",
            estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  const ord1008 = await prisma.order.create({
    data: {
      userId: priya.id,
      orderNumber: "ORD-1008",
      status: "processing",
      total: 199.99,
      items: {
        create: [{ productName: "Noise Cancelling Headphones", quantity: 1, unitPrice: 199.99 }],
      },
    },
  });

  const inv2001 = await prisma.invoice.create({
    data: {
      userId: alice.id,
      orderId: ord1004.id,
      invoiceNumber: "INV-2001",
      amount: 59.99,
      status: "paid",
      paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      refunds: {
        create: [
          {
            amount: 59.99,
            status: "processing",
            reason: "USB-C hub arrived with a cracked housing.",
          },
        ],
      },
    },
  });

  const inv2002 = await prisma.invoice.create({
    data: {
      userId: marcus.id,
      orderId: ord1006.id,
      invoiceNumber: "INV-2002",
      amount: 349.0,
      status: "paid",
      paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      refunds: {
        create: [
          {
            amount: 120.0,
            status: "approved",
            reason: "Partial refund — desk frame missing mounting hardware.",
          },
        ],
      },
    },
  });

  const inv2003 = await prisma.invoice.create({
    data: {
      userId: alice.id,
      orderId: ord1003.id,
      invoiceNumber: "INV-2003",
      amount: 249.5,
      status: "open",
    },
  });

  const inv2004 = await prisma.invoice.create({
    data: {
      userId: priya.id,
      orderId: ord1008.id,
      invoiceNumber: "INV-2004",
      amount: 199.99,
      status: "draft",
    },
  });

  const inv2005 = await prisma.invoice.create({
    data: {
      userId: marcus.id,
      orderId: ord1005.id,
      invoiceNumber: "INV-2005",
      amount: 44.0,
      status: "void",
    },
  });

  const inv2006 = await prisma.invoice.create({
    data: {
      userId: priya.id,
      orderId: ord1007.id,
      invoiceNumber: "INV-2006",
      amount: 79.98,
      status: "paid",
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      refunds: {
        create: [
          {
            amount: 79.98,
            status: "completed",
            reason: "Order marked as a shipping exception; customer opted for a full refund.",
            completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      userId: alice.id,
      title: "Where is my monitor order?",
      messages: {
        create: [
          {
            role: "user",
            content: "Hey, can you check on ORD-1003? It's been a few days.",
          },
          {
            role: "assistant",
            content:
              "I checked ORD-1003 — it's shipped via UPS and currently in transit, estimated to arrive in a few days. Tracking number 1Z999AA10123456784.",
            agentType: "order",
            reasoning: "Message references an order number and asks for shipping status.",
            toolCalls: [{ name: "checkDeliveryStatus", args: { orderNumber: "ORD-1003" } }],
          },
          { role: "user", content: "Great, thanks!" },
          {
            role: "assistant",
            content: "You're welcome! Let me know if anything else comes up.",
            agentType: "order",
          },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      userId: marcus.id,
      title: "Refund status on my desk order",
      messages: {
        create: [
          {
            role: "user",
            content: "I requested a partial refund on INV-2002 a while back, any update?",
          },
          {
            role: "assistant",
            content:
              "Your refund of $120.00 on INV-2002 has been approved and is on its way to your original payment method.",
            agentType: "billing",
            reasoning: "Message asks for the status of a previously requested refund on a specific invoice.",
            toolCalls: [{ name: "checkRefundStatus", args: { invoiceNumber: "INV-2002" } }],
          },
        ],
      },
    },
  });

  await prisma.conversation.create({
    data: {
      userId: priya.id,
      title: "What's your return policy?",
      messages: {
        create: [
          { role: "user", content: "What's your return policy for electronics?" },
          {
            role: "assistant",
            content:
              "Electronics can be returned within 30 days of delivery in original condition. If an item arrives damaged, we cover return shipping.",
            agentType: "support",
            reasoning: "General policy question not tied to a specific order or invoice.",
          },
          { role: "user", content: "What did I ask about last time I messaged you?" },
          {
            role: "assistant",
            content:
              "Looking back at our conversation history, you didn't have a prior conversation with us before this one.",
            agentType: "support",
            reasoning: "Customer is asking about prior conversation history.",
            toolCalls: [{ name: "searchConversationHistory", args: { userId: priya.id, query: "last message" } }],
          },
        ],
      },
    },
  });

  console.log("Seed complete:");
  console.log(`  Users: 3 (${alice.email}, ${marcus.email}, ${priya.email})`);
  console.log("  Orders: 8 (statuses: pending, processing x2, shipped x2, delivered x2, cancelled)");
  console.log("  Shipments: 4 (including 1 exception)");
  console.log(`  Invoices: 6 (${[inv2001, inv2002, inv2003, inv2004, inv2005, inv2006].length}), refunds: 3 (2 mid-flight, 1 completed)`);
  console.log("  Conversations: 3, with messages");
  console.log(`  Login: any seeded email above, password "${DEMO_PASSWORD}"`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
