import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversations as conversationsTable, messages as messagesTable } from "@workspace/db/schema";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

const JAMMY_SYSTEM_PROMPT = `You are Jammy, the friendly AI assistant for Jambites — a food delivery app that brings snacks, drinks, and medicines directly to your car window when you're stuck in traffic jams in Indian cities.

Your personality:
- Warm, witty, and traffic-savvy
- Speak like a helpful friend, not a corporate bot
- Use light Indian English expressions occasionally (like "yaar", "arre", "no no") to feel local
- Keep responses concise and mobile-friendly — users are in a car!

Your greeting: "Hey! Stuck in a jam? I've got you. 🍔"

You can help with:
- Menu recommendations ("What's good for kids?", "Give me something spicy")
- Order status queries
- Complaint handling
- Medicine queries (Crocin, antacids, ORS)
- Traffic-aware suggestions
- Payment help (UPI, cards, cash)
- Reorder shortcuts

Available categories: Snacks, Drinks, Medicines, Combos
Available vendors: Sharma Ji Ke Samose (samosas, chai), Chai Point Express (teas, coffee), Quick Meds (medicines), Burger Bros (burgers, fries), Healthy Bites (fruits, energy bars)

Delivery is in under 7 minutes. Delivery fee is ₹10-₹20. Available in Delhi, Mumbai, Bengaluru.

Keep responses short (2-4 sentences max). No long lists. Be helpful and fun!`;

router.get("/anthropic/conversations", async (req, res) => {
  try {
    const conversations = await db
      .select()
      .from(conversationsTable)
      .orderBy(asc(conversationsTable.createdAt));
    res.json(conversations);
  } catch (err) {
    req.log.error({ err }, "Failed to list conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/anthropic/conversations", async (req, res) => {
  try {
    const { title } = req.body;
    const [conversation] = await db
      .insert(conversationsTable)
      .values({ title: title || "New Chat" })
      .returning();
    res.status(201).json(conversation);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/anthropic/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(asc(messagesTable.createdAt));
    res.json({ ...conversation, messages });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversation");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

router.delete("/anthropic/conversations/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(messagesTable).where(eq(messagesTable.conversationId, id));
    const deleted = await db
      .delete(conversationsTable)
      .where(eq(conversationsTable.id, id))
      .returning();
    if (!deleted.length) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.get("/anthropic/conversations/:id/messages", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(asc(messagesTable.createdAt));
    res.json(messages);
  } catch (err) {
    req.log.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/anthropic/conversations/:id/messages", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content } = req.body;

    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(messagesTable).values({
      conversationId: id,
      role: "user",
      content,
    });

    const previousMessages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(asc(messagesTable.createdAt));

    const chatMessages = previousMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let fullResponse = "";

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: JAMMY_SYSTEM_PROMPT,
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullResponse += event.delta.text;
        res.write(
          `data: ${JSON.stringify({ content: event.delta.text })}\n\n`
        );
      }
    }

    await db.insert(messagesTable).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
    res.end();
  }
});

export default router;
