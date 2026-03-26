import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  Pressable,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Send, Bot } from "lucide-react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { fetch } from "expo/fetch";

import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";

const C = Colors.light;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgCounter = 0;
function makeId(): string {
  msgCounter++;
  return `msg-${Date.now()}-${msgCounter}`;
}

const DEFAULT_CHIPS = [
  "What's popular? 🔥",
  "Good for kids? 👶",
  "Quick medicine? 💊",
];

const FOOD_CHIPS = ["Spicy snacks? 🌶️", "Combo deal? 🎁", "Veg options? 🥗"];
const DRINK_CHIPS = ["Cold coffee? ☕", "Chai suggestion? 🍵", "Cold drinks? 🧃"];
const MEDICINE_CHIPS = ["Paracetamol? 💊", "Antacid? 🤍", "ORS available? 💧"];
const BURGER_CHIPS = ["Mini fries? 🍟", "Veg burger? 🍔", "Milkshake? 🥤"];

function getContextualChips(lastResponse: string): string[] {
  const lower = lastResponse.toLowerCase();
  if (lower.includes("medicine") || lower.includes("paracetamol") || lower.includes("ors") || lower.includes("antacid")) return MEDICINE_CHIPS;
  if (lower.includes("coffee") || lower.includes("chai") || lower.includes("drink") || lower.includes("mango")) return DRINK_CHIPS;
  if (lower.includes("burger") || lower.includes("fries") || lower.includes("shake")) return BURGER_CHIPS;
  if (lower.includes("samosa") || lower.includes("kachori") || lower.includes("snack")) return FOOD_CHIPS;
  return DEFAULT_CHIPS;
}

const MOODS = [
  { emoji: "😴", label: "Tired", message: "I'm feeling tired and drowsy, what should I order to stay awake?" },
  { emoji: "😤", label: "Stressed", message: "I'm stressed in this traffic jam, what comfort food can cheer me up?" },
  { emoji: "🤒", label: "Unwell", message: "I'm not feeling well, what medicines or light food do you recommend?" },
  { emoji: "😄", label: "Happy", message: "I'm in a great mood! Suggest something fun and delicious!" },
];

function TypingIndicatorDots() {
  const anims = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const createAnim = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 380, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 380, easing: Easing.ease, useNativeDriver: true }),
        ])
      );
    const a0 = createAnim(anims[0], 0);
    const a1 = createAnim(anims[1], 180);
    const a2 = createAnim(anims[2], 360);
    a0.start(); a1.start(); a2.start();
    return () => { a0.stop(); a1.stop(); a2.stop(); };
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.botAvatar}>
        <Bot size={13} color={C.orange} />
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          {anims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[styles.typingDot, { opacity: anim, transform: [{ scale: anim }] }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Bot size={13} color={C.orange} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{message.content}</Text>
      </View>
    </View>
  );
}

let conversationId: number | null = null;

async function ensureConversation(): Promise<number> {
  if (conversationId) return conversationId;
  const url = getApiUrl();
  const res = await fetch(`${url}api/anthropic/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Jammy Chat" }),
  });
  const data = (await res.json()) as { id: number };
  conversationId = data.id;
  return conversationId;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "Hey! Stuck in a jam? I'm Jammy 🍔 Tell me what you need and I'll sort you out!" },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [chips, setChips] = useState(DEFAULT_CHIPS);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Message = { id: makeId(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);
    setShowTyping(true);

    try {
      const convId = await ensureConversation();
      const url = getApiUrl();
      const response = await fetch(
        `${url}api/anthropic/conversations/${convId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
          body: JSON.stringify({ content: trimmed }),
        }
      );
      if (!response.ok) throw new Error("Failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";
      let added = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6)) as { content?: string };
            if (parsed.content) {
              fullContent += parsed.content;
              if (!added) {
                setShowTyping(false);
                setMessages((prev) => [...prev, { id: makeId(), role: "assistant", content: fullContent }]);
                added = true;
              } else {
                setMessages((prev) => {
                  const u = [...prev];
                  u[u.length - 1] = { ...u[u.length - 1], content: fullContent };
                  return u;
                });
              }
            }
          } catch {}
        }
      }
      setChips(getContextualChips(fullContent));
    } catch {
      setShowTyping(false);
      setMessages((prev) => [...prev, { id: makeId(), role: "assistant", content: "Arre yaar, something went wrong! Try again? 😅" }]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  }, [isStreaming]);

  const handleMood = useCallback((mood: typeof MOODS[0]) => {
    setActiveMood(mood.label);
    sendMessage(mood.message);
  }, [sendMessage]);

  const reversedMessages = [...messages].reverse();

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.jammyAvatar}>
            <Bot size={22} color="#FFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Jammy</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>AI food assistant</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.moodBanner}>
        <Text style={styles.moodLabel}>How are you feeling?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((mood) => (
            <TouchableOpacity
              key={mood.label}
              style={[styles.moodBtn, activeMood === mood.label && styles.moodBtnActive]}
              onPress={() => handleMood(mood)}
              disabled={isStreaming}
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text style={[styles.moodBtnLabel, activeMood === mood.label && styles.moodBtnLabelActive]}>
                {mood.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView style={styles.kav} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          inverted={messages.length > 0}
          ListHeaderComponent={showTyping ? <TypingIndicatorDots /> : null}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.chipsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsList}
          >
            {chips.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={styles.chip}
                onPress={() => sendMessage(chip)}
                disabled={isStreaming}
              >
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.inputRow, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 4 }]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask Jammy anything..."
            placeholderTextColor={C.textMuted}
            multiline
            maxLength={500}
            blurOnSubmit={false}
            returnKeyType="send"
            onSubmitEditing={() => { sendMessage(input); inputRef.current?.focus(); }}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || isStreaming) && styles.sendBtnDisabled]}
            onPress={() => { sendMessage(input); inputRef.current?.focus(); }}
            disabled={!input.trim() || isStreaming}
          >
            <Send size={18} color="#FFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  jammyAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: C.text },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.successGreen },
  onlineText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: C.textSecondary },
  moodBanner: { backgroundColor: "#FFF7ED", borderBottomWidth: 1, borderBottomColor: "rgba(232,93,4,0.12)", paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  moodLabel: { fontFamily: "Poppins_500Medium", fontSize: 12, color: C.textSecondary },
  moodRow: { flexDirection: "row", gap: 8 },
  moodBtn: { flex: 1, alignItems: "center", backgroundColor: "#FFF", borderRadius: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: "rgba(232,93,4,0.2)", gap: 2 },
  moodBtnActive: { backgroundColor: C.orange, borderColor: C.orange },
  moodEmoji: { fontSize: 20 },
  moodBtnLabel: { fontFamily: "Poppins_500Medium", fontSize: 11, color: C.orange },
  moodBtnLabelActive: { color: "#FFF" },
  kav: { flex: 1 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 8 },
  messageRowUser: { justifyContent: "flex-end" },
  botAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(232,93,4,0.2)" },
  bubble: { maxWidth: "76%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleBot: { backgroundColor: "#FFF7ED", borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: C.orange, borderBottomRightRadius: 4 },
  bubbleText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: C.text, lineHeight: 20 },
  bubbleTextUser: { color: "#FFF" },
  typingContainer: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 8 },
  typingBubble: { backgroundColor: "#FFF7ED", borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 13 },
  typingDots: { flexDirection: "row", gap: 5, alignItems: "center" },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.orange },
  chipsWrap: { borderTopWidth: 1, borderTopColor: C.borderLight },
  chipsList: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { borderWidth: 1.5, borderColor: "rgba(232,93,4,0.3)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: "#FFF7ED" },
  chipText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: C.orange },
  inputRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.borderLight, backgroundColor: C.background, gap: 8 },
  input: { flex: 1, backgroundColor: C.backgroundSecondary, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, fontFamily: "Poppins_400Regular", fontSize: 14, color: C.text, maxHeight: 100, borderWidth: 1, borderColor: C.border },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.orange, alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { backgroundColor: C.textMuted },
});
