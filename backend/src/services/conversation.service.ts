import type { AgentType, MessageRole, Prisma } from "@prisma/client";
import { prisma } from "../db/client.js";
import { NotFoundError } from "../lib/errors.js";

export interface MessageDetails {
  id: string;
  role: MessageRole;
  content: string;
  agentType: AgentType | null;
  reasoning: string | null;
  toolCalls: unknown;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetails extends ConversationSummary {
  messages: MessageDetails[];
}

export interface ConversationSearchResult {
  conversationId: string;
  conversationTitle: string | null;
  message: MessageDetails;
}

export interface NewMessageInput {
  role: MessageRole;
  content: string;
  agentType?: AgentType;
  reasoning?: string;
  toolCalls?: unknown;
}

function toSummary(conversation: {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ConversationSummary {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

function toMessageDetails(message: {
  id: string;
  role: MessageRole;
  content: string;
  agentType: AgentType | null;
  reasoning: string | null;
  toolCalls: Prisma.JsonValue;
  createdAt: Date;
}): MessageDetails {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    agentType: message.agentType,
    reasoning: message.reasoning,
    toolCalls: message.toolCalls,
    createdAt: message.createdAt.toISOString(),
  };
}

export const conversationService = {
  async listByUser(userId: string): Promise<ConversationSummary[]> {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return conversations.map(toSummary);
  },

  /**
   * `userId` scopes the lookup to its owner — a mismatch and a missing
   * conversation both resolve to NotFoundError, so a caller can't tell the
   * difference between "doesn't exist" and "exists but isn't yours".
   */
  async getById(conversationId: string, userId: string): Promise<ConversationDetails> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!conversation) {
      throw new NotFoundError(`No conversation found with id ${conversationId}`);
    }

    return {
      ...toSummary(conversation),
      messages: conversation.messages.map(toMessageDetails),
    };
  },

  async getRecentMessages(conversationId: string, limit = 10): Promise<MessageDetails[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return messages.reverse().map(toMessageDetails);
  },

  async create(userId: string, title?: string): Promise<ConversationSummary> {
    const conversation = await prisma.conversation.create({
      data: { userId, title },
    });
    return toSummary(conversation);
  },

  async addMessage(conversationId: string, input: NewMessageInput): Promise<MessageDetails> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundError(`No conversation found with id ${conversationId}`);
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        role: input.role,
        content: input.content,
        agentType: input.agentType,
        reasoning: input.reasoning,
        toolCalls: input.toolCalls as Prisma.InputJsonValue,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return toMessageDetails(message);
  },

  async remove(conversationId: string, userId: string): Promise<void> {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundError(`No conversation found with id ${conversationId}`);
    }

    await prisma.conversation.delete({ where: { id: conversationId } });
  },

  async searchHistory(userId: string, query: string): Promise<ConversationSearchResult[]> {
    const messages = await prisma.message.findMany({
      where: {
        conversation: { userId },
        content: { contains: query, mode: "insensitive" },
      },
      include: { conversation: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return messages.map((message) => ({
      conversationId: message.conversationId,
      conversationTitle: message.conversation.title,
      message: toMessageDetails(message),
    }));
  },
};
