import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { conversations as conversationsTable, messages as messagesTable } from "@workspace/db/schema";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

const JAMMY_SYSTEM_PROMPT = `You are Jammy, an upbeat and helpful AI food assistant for Jambites — an app that delivers snacks, drinks, and medicines to people stuck in traffic jams. Keep responses short (2-4 sentences max), friendly, and use 1-2 emojis per message. You know the following vendors are nearby:
1. Sharma Ji Ke Samose — Snacks (Aloo Samosa ₹15, Paneer Kachori ₹20, Pyaaz Kachori ₹15, Combo Pack ₹55)
2. Chai Point Express — Drinks (Masala Chai ₹20, Cold Coffee ₹35, Mango Drink ₹30)
3. Quick Meds — Medicines (ORS Packet ₹25, Paracetamol ₹15, Antacid ₹20)
4. Burger Bros — Snacks (Mini Fries ₹40, Veg Burger ₹65, Shake ₹55)
You can recommend items, suggest combos, and tell the user what's available. If asked about order status, say the order is being prepared and will arrive in about 6 minutes. Do not make up items not listed above. Always end with a helpful follow-up question or offer.`;

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
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
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

router.get("/anthropic/jam-message", async (req, res) => {
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 60,
      messages: [{
        role: "user",
        content: "Generate a single short, witty, empathetic message (max 12 words) for someone stuck in Delhi traffic at peak hours. Make it feel friendly and slightly funny. Don't use exclamation marks. Examples of tone: \"Looks like the road decided to take a nap today\" or \"Traffic's bad but your snacks don't have to wait\". Return only the message text, nothing else.",
      }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text.trim() : null;
    res.json({ message: text });
  } catch (err) {
    req.log.error({ err }, "Failed to generate jam message");
    res.status(500).json({ error: "Failed" });
  }
});

router.post("/anthropic/menu-recommendations", async (req, res) => {
  try {
    const { items } = req.body as { items: { name: string; price: number; category: string }[] };
    if (!items || items.length === 0) {
      res.status(400).json({ error: "No items provided" });
      return;
    }
    const itemList = items.map((i) => `${i.name} (₹${i.price}, ${i.category})`).join(", ");
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `A user is stuck in traffic in Delhi at 4:30 PM. They previously ordered Aloo Samosa and Paneer Kachori. From the following menu items: ${itemList}, return a JSON array of the top 3 recommended item names with a one-word reason each. Format: [{"name": "item name", "reason": "one word reason"}]. Return only the JSON array, nothing else.`,
      }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    const recommendations = parsed.slice(0, 3).map((r: { name: string; reason: string }) => ({
      name: r.name,
      reason: r.reason,
      item: items.find((i) => i.name.toLowerCase().includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(i.name.toLowerCase())),
    })).filter((r: { item: unknown }) => r.item);
    res.json({ recommendations });
  } catch (err) {
    req.log.error({ err }, "Failed to generate recommendations");
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
