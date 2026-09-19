import { supabase } from "../services/cache/supabaseClient";
import { ixcLogger } from "../utils/logger";
import { ChatbotIntent, ConversationRecord, ConversationStatus } from "./types";

interface MessageRecord {
  conversationId: string;
  direction: "IN" | "OUT";
  content: string;
  intent?: ChatbotIntent;
  origin: "api" | "whatsapp" | "bot";
  externalMessageId?: string;
  createdAt: string;
}

const conversations = new Map<string, ConversationRecord>();
const messages: MessageRecord[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

export class ChatbotConversationStore {
  async getOrCreate(phone: string, customerId?: number, contractId?: number): Promise<ConversationRecord> {
    const existing = await this.findOpenByPhone(phone);
    if (existing) {
      return this.updateConversation(existing.id, { customerId, contractId, status: "BOT" });
    }

    const record: ConversationRecord = {
      id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      phone,
      customerId,
      contractId,
      status: "OPEN",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    conversations.set(record.id, record);
    if (supabase) {
      await supabase.from("chatbot_conversations").insert({
        id: record.id,
        phone: record.phone,
        customer_id: record.customerId,
        contract_id: record.contractId,
        status: record.status,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });
    }
    return record;
  }

  async findOpenByPhone(phone: string): Promise<ConversationRecord | null> {
    if (supabase) {
      const { data, error } = await supabase
        .from("chatbot_conversations")
        .select("*")
        .eq("phone", phone)
        .not("status", "in", "(RESOLVED,CLOSED)")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          phone: data.phone,
          customerId: data.customer_id,
          contractId: data.contract_id,
          status: data.status,
          funnelState: data.funnel_state,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    }

    return Array.from(conversations.values())
      .filter((item) => item.phone === phone && !["RESOLVED", "CLOSED"].includes(item.status))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] || null;
  }

  async updateConversation(id: string, patch: Partial<ConversationRecord>): Promise<ConversationRecord> {
    const current = conversations.get(id) || ({
      id,
      phone: patch.phone || "",
      status: "OPEN" as ConversationStatus,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    const updated = { ...current, ...patch, updatedAt: nowIso() };
    conversations.set(id, updated);

    if (supabase) {
      const { error } = await supabase.from("chatbot_conversations").upsert({
        id: updated.id,
        phone: updated.phone,
        customer_id: updated.customerId,
        contract_id: updated.contractId,
        status: updated.status,
        funnel_state: updated.funnelState,
        created_at: updated.createdAt,
        updated_at: updated.updatedAt,
      });
      if (error) ixcLogger.warn("Falha ao atualizar conversa no Supabase", { error: error.message });
    }
    return updated;
  }

  async addMessage(message: MessageRecord): Promise<void> {
    messages.push(message);
    if (!supabase) return;

    const { error } = await supabase.from("chatbot_messages").insert({
      conversation_id: message.conversationId,
      direction: message.direction,
      content: message.content,
      intent: message.intent,
      origin: message.origin,
      external_message_id: message.externalMessageId,
      created_at: message.createdAt,
    });
    if (error) ixcLogger.warn("Falha ao salvar mensagem do chatbot", { error: error.message });
  }

  async listMessages(phone: string, limit = 20): Promise<MessageRecord[]> {
    const conversation = await this.findOpenByPhone(phone);
    if (!conversation) return [];

    if (supabase) {
      const { data, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data.reverse().map((row) => ({
          conversationId: row.conversation_id,
          direction: row.direction,
          content: row.content,
          intent: row.intent,
          origin: row.origin,
          externalMessageId: row.external_message_id,
          createdAt: row.created_at,
        }));
      }
    }

    return messages
      .filter((item) => item.conversationId === conversation.id)
      .slice(-limit);
  }

  async addEvent(event: Record<string, unknown>): Promise<void> {
    if (!supabase) return;
    await supabase.from("chatbot_events").insert({
      event_type: event.type,
      payload: event,
      created_at: nowIso(),
    });
  }
}

export const chatbotConversationStore = new ChatbotConversationStore();
