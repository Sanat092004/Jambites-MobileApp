import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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

let messageCounter = 0;
function generateId(): string {
  messageCounter++;
  return `msg-${Date.now()}-${messageCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

const QUICK_REPLIES = [
  "What's good for kids?",
  "Something spicy?",
  "Do you have Crocin?",
  "How long is delivery?",
];

function TypingIndicator() {
  return (
    <View style={styles.typingContainer}>
      <View style={styles.botAvatar}>
        <MaterialCommunityIcons name="robot-happy" size={16} color={C.orange} />
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
      </View>
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.messagRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <MaterialCommunityIcons name="robot-happy" size={16} color={C.orange} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleBot,
        ]}
      >
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.content}
        </Text>
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
  const data = await res.json() as { id: number };
  conversationId = data.id;
  return conversationId;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! Stuck in a jam? I've got you! I'm Jammy, your traffic buddy. What can I get for you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const currentMessages = [...messages];
    const userMsg: Message = { id: generateId(), role: "user", content: trimmed };
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
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({ content: trimmed }),
        }
      );

      if (!response.ok) throw new Error("Failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";
      let assistantAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data) as { content?: string; done?: boolean };
            if (parsed.content) {
              fullContent += parsed.content;
              if (!assistantAdded) {
                setShowTyping(false);
                setMessages((prev) => [
                  ...prev,
                  { id: generateId(), role: "assistant", content: fullContent },
                ]);
                assistantAdded = true;
              } else {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: fullContent,
                  };
                  return updated;
                });
              }
            }
          } catch {}
        }
      }
    } catch {
      setShowTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "Arre yaar, something went wrong! Try again in a sec.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  }, [messages, isStreaming]);

  const reversedMessages = [...messages].reverse();

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.jammyAvatar}>
            <MaterialCommunityIcons name="robot-happy" size={22} color="#FFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Jammy</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Always here for you</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          inverted={messages.length > 0}
          ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
        />

        {/* Quick Replies */}
        {messages.length <= 1 && (
          <View style={styles.quickRepliesWrap}>
            <FlatList
              horizontal
              data={QUICK_REPLIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.quickReply}
                  onPress={() => handleSend(item)}
                >
                  <Text style={styles.quickReplyText}>{item}</Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRepliesList}
            />
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 4 }]}>
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
            onSubmitEditing={() => {
              handleSend(input);
              inputRef.current?.focus();
            }}
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || isStreaming) && styles.sendBtnDisabled]}
            onPress={() => {
              handleSend(input);
              inputRef.current?.focus();
            }}
            disabled={!input.trim() || isStreaming}
          >
            <Feather name="send" size={18} color="#FFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  jammyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: C.text,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.successGreen,
  },
  onlineText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: C.textSecondary,
  },
  kav: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  messagRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(232,93,4,0.2)",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleBot: {
    backgroundColor: "#FFF7ED",
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: C.orange,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: "#FFF",
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: "#FFF7ED",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.orange,
    opacity: 0.5,
  },
  dot1: {},
  dot2: { opacity: 0.7 },
  dot3: { opacity: 0.9 },
  quickRepliesWrap: {
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  quickRepliesList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  quickReply: {
    borderWidth: 1.5,
    borderColor: "rgba(232,93,4,0.3)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFF7ED",
  },
  quickReplyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: C.orange,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
    backgroundColor: C.background,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: C.backgroundSecondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: C.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: C.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: C.textMuted,
  },
});
