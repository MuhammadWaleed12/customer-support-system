import { ROUTER_AGENT_TYPES, type RouterAgentType } from "./router.agent.js";

export type AgentType = "router" | RouterAgentType;

export interface ToolDescriptor {
  name: string;
  description: string;
}

export interface AgentMetadata {
  type: AgentType;
  label: string;
  description: string;
  color: string;
  icon: string;
  tools: ToolDescriptor[];
}

export const AGENT_REGISTRY: AgentMetadata[] = [
  {
    type: "router",
    label: "Router",
    description: "Classifies each incoming message and delegates it to a specialist agent.",
    color: "#6b7280",
    icon: "GitBranch",
    tools: [],
  },
  {
    type: "support",
    label: "Support",
    description: "General inquiries, FAQs, troubleshooting, and prior conversation recall.",
    color: "#3b82f6",
    icon: "LifeBuoy",
    tools: [
      {
        name: "searchConversationHistory",
        description: "Search the customer's past conversations for a keyword or phrase.",
      },
    ],
  },
  {
    type: "order",
    label: "Order",
    description: "Order status, tracking, modifications, and cancellations.",
    color: "#f97316",
    icon: "Package",
    tools: [
      { name: "fetchOrderDetails", description: "Fetch full order details by order number." },
      {
        name: "checkDeliveryStatus",
        description: "Check shipping carrier, tracking number, and delivery status.",
      },
    ],
  },
  {
    type: "billing",
    label: "Billing",
    description: "Invoices, refund status, and subscription charges.",
    color: "#10b981",
    icon: "Receipt",
    tools: [
      { name: "getInvoiceDetails", description: "Fetch full invoice details by invoice number." },
      { name: "checkRefundStatus", description: "Check the status of refunds tied to an invoice." },
    ],
  },
  {
    type: "fallback",
    label: "Fallback",
    description: "Greetings, off-topic messages, and anything below the routing confidence floor.",
    color: "#8b5cf6",
    icon: "HelpCircle",
    tools: [],
  },
];

export function isAgentType(value: string): value is AgentType {
  return value === "router" || ROUTER_AGENT_TYPES.includes(value as RouterAgentType);
}
