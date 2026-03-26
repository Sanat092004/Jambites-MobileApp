import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  SectionList,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Star,
  Clock,
  ChevronRight,
  Search,
  X,
  Plus,
  Minus,
  Utensils,
  Coffee,
  Pill,
  AlertCircle,
  Sparkles,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";

import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";
import { useCart } from "@/context/CartContext";

const C = Colors.light;

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isVeg: boolean;
  isBestseller: boolean;
};

type MenuSection = { title: string; items: MenuItem[] };

type VendorMenu = {
  vendor: {
    id: string;
    name: string;
    description: string;
    rating: number;
    deliveryTimeMin: number;
    deliveryFee: number;
    distance: number;
  };
  sections: MenuSection[];
};

type AIRec = { name: string; reason: string; item: MenuItem };

async function fetchMenu(vendorId: string): Promise<VendorMenu> {
  const url = getApiUrl();
  const res = await fetch(`${url}api/jambites/vendors/${vendorId}/menu`);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

async function fetchAIRecommendations(items: MenuItem[]): Promise<AIRec[]> {
  try {
    const url = getApiUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${url}api/anthropic/menu-recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ name: i.name, price: i.price, category: i.category })),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = (await res.json()) as { recommendations: AIRec[] };
    return data.recommendations || [];
  } catch {
    return [];
  }
}

function VegDot({ isVeg }: { isVeg: boolean }) {
  return (
    <View style={[styles.vegBox, { borderColor: isVeg ? C.vegGreen : C.nonVegRed }]}>
      <View style={[styles.vegDot, { backgroundColor: isVeg ? C.vegGreen : C.nonVegRed }]} />
    </View>
  );
}

function MenuItemIcon({ category, isVeg }: { category: string; isVeg: boolean }) {
  const color = isVeg ? C.vegGreen : C.nonVegRed;
  if (category === "Medicines") return <Pill size={28} color="#6366F1" />;
  if (category === "Drinks") return <Coffee size={28} color={color} />;
  return <Utensils size={28} color={color} />;
}

function AIRecommendationCard({ rec, vendorId, vendorName }: { rec: AIRec; vendorId: string; vendorName: string }) {
  const { items: cartItems, addItem, removeItem } = useCart();
  const cartItem = cartItems.find((i) => i.id === rec.item.id);
  const qty = cartItem?.quantity || 0;

  const handleAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem({ id: rec.item.id, name: rec.item.name, price: rec.item.price, isVeg: rec.item.isVeg, vendorId, vendorName });
  }, [rec.item, vendorId, vendorName, addItem]);

  const handleRemove = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeItem(rec.item.id);
  }, [rec.item.id, removeItem]);

  const bgColor = rec.item.category === "Medicines" ? "#EEF2FF" : rec.item.isVeg ? "#F0FDF4" : "#FFF5F5";

  return (
    <View style={styles.aiCard}>
      <View style={styles.aiPickBadge}>
        <Sparkles size={10} color="#FFF" />
        <Text style={styles.aiPickText}>AI Pick</Text>
      </View>
      <View style={[styles.aiCardImage, { backgroundColor: bgColor }]}>
        <MenuItemIcon category={rec.item.category} isVeg={rec.item.isVeg} />
      </View>
      <Text style={styles.aiCardName} numberOfLines={2}>{rec.item.name}</Text>
      <View style={styles.aiReasonBadge}>
        <Text style={styles.aiReasonText}>{rec.reason}</Text>
      </View>
      <Text style={styles.aiCardPrice}>₹{rec.item.price}</Text>
      {qty === 0 ? (
        <TouchableOpacity style={styles.aiAddBtn} onPress={handleAdd}>
          <Plus size={14} color={C.orange} />
          <Text style={styles.aiAddBtnText}>ADD</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.aiQtyControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={handleRemove}>
            <Minus size={12} color={C.orange} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{qty}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={handleAdd}>
            <Plus size={12} color={C.orange} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function MenuItemCard({ item, vendorId, vendorName }: { item: MenuItem; vendorId: string; vendorName: string }) {
  const { items: cartItems, addItem, removeItem } = useCart();
  const cartItem = cartItems.find((i) => i.id === item.id);
  const qty = cartItem?.quantity || 0;

  const handleAdd = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem({ id: item.id, name: item.name, price: item.price, isVeg: item.isVeg, vendorId, vendorName });
  }, [item, vendorId, vendorName, addItem]);

  const handleRemove = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeItem(item.id);
  }, [item.id, removeItem]);

  const bgColor = item.category === "Medicines" ? "#EEF2FF" : item.isVeg ? "#F0FDF4" : "#FFF5F5";

  return (
    <View style={styles.menuItemCard}>
      <View style={styles.menuItemLeft}>
        {item.isBestseller && (
          <View style={styles.bestsellerBadge}>
            <Text style={styles.bestsellerText}>Bestseller</Text>
          </View>
        )}
        <View style={styles.menuItemTop}>
          <VegDot isVeg={item.isVeg} />
          <Text style={styles.menuItemName}>{item.name}</Text>
        </View>
        <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.menuItemPrice}>₹{item.price}</Text>
      </View>
      <View style={styles.menuItemRight}>
        <View style={[styles.menuItemImage, { backgroundColor: bgColor }]}>
          <MenuItemIcon category={item.category} isVeg={item.isVeg} />
        </View>
        {qty === 0 ? (
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyControl}>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleRemove}>
              <Minus size={14} color={C.orange} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{qty}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={handleAdd}>
              <Plus size={14} color={C.orange} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default function MenuScreen() {
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [aiRecs, setAiRecs] = useState<AIRec[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const sectionListRef = useRef<SectionList>(null);
  const { totalItems, totalPrice } = useCart();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["menu", vendorId],
    queryFn: () => fetchMenu(vendorId),
    enabled: !!vendorId,
  });

  useEffect(() => {
    if (!data) return;
    const allItems = data.sections.flatMap((s) => s.items);
    setAiLoading(true);
    fetchAIRecommendations(allItems).then((recs) => {
      setAiRecs(recs);
      setAiLoading(false);
    });
  }, [data]);

  const filtered = searchQuery
    ? data?.sections.map((s) => ({
        ...s,
        items: s.items.filter((i) =>
          i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((s) => s.items.length > 0)
    : data?.sections || [];

  const sectionData = filtered.map((s) => ({ title: s.title, data: s.items }));
  const categories = data?.sections.map((s) => s.title) || [];
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={C.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.orange} />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={C.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <AlertCircle size={48} color={C.errorRed} />
          <Text style={styles.errorText}>Failed to load menu</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.vendorHeaderInfo}>
          <Text style={styles.vendorHeaderName} numberOfLines={1}>{data.vendor.name}</Text>
          <View style={styles.vendorMeta}>
            <Star size={12} color={C.amber} fill={C.amber} />
            <Text style={styles.vendorMetaText}>{data.vendor.rating.toFixed(1)}</Text>
            <View style={styles.metaDot} />
            <Clock size={11} color={C.textSecondary} />
            <Text style={styles.vendorMetaText}>{data.vendor.deliveryTimeMin} min</Text>
            <View style={styles.metaDot} />
            <Text style={styles.vendorMetaText}>{Math.round(data.vendor.distance * 1000)}m away</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={16} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu..."
          placeholderTextColor={C.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <X size={16} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <SectionList
        ref={sectionListRef}
        sections={sectionData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MenuItemCard item={item} vendorId={vendorId} vendorName={data.vendor.name} />
        )}
        renderSectionHeader={({ section: { title, data: items } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionCount}>{items.length} items</Text>
          </View>
        )}
        ListHeaderComponent={
          <>
            {(aiLoading || aiRecs.length > 0) && !searchQuery && (
              <View style={styles.aiSection}>
                <View style={styles.aiSectionHeader}>
                  <Sparkles size={16} color={C.orange} />
                  <Text style={styles.aiSectionTitle}>Recommended for You</Text>
                </View>
                {aiLoading ? (
                  <View style={styles.aiLoadingRow}>
                    <ActivityIndicator color={C.orange} size="small" />
                    <Text style={styles.aiLoadingText}>Getting AI picks...</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aiCardsList}>
                    {aiRecs.map((rec, i) => (
                      <AIRecommendationCard key={i} rec={rec} vendorId={vendorId} vendorName={data.vendor.name} />
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
            {categories.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabsRow}>
                {categories.map((cat, idx) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catTab, activeCategory === cat && styles.catTabActive]}
                    onPress={() => {
                      setActiveCategory(cat);
                      sectionListRef.current?.scrollToLocation({ sectionIndex: idx, itemIndex: 0, animated: true, viewOffset: 0 });
                    }}
                  >
                    <Text style={[styles.catTabText, activeCategory === cat && styles.catTabTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        }
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Search size={40} color={C.textMuted} />
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {totalItems > 0 && (
        <Pressable
          style={[styles.cartBar, { bottom: Platform.OS === "web" ? 24 : insets.bottom + 16 }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/checkout"); }}
        >
          <View style={styles.cartLeft}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
            <Text style={styles.cartText}>{totalItems} item{totalItems > 1 ? "s" : ""}</Text>
          </View>
          <View style={styles.cartRight}>
            <Text style={styles.cartTotal}>₹{totalPrice}</Text>
            <Text style={styles.cartCta}>View Cart</Text>
            <ChevronRight size={16} color="#FFF" />
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 40 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.backgroundSecondary, alignItems: "center", justifyContent: "center" },
  vendorHeaderInfo: { flex: 1 },
  vendorHeaderName: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: C.text },
  vendorMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  vendorMetaText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: C.textSecondary },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textMuted },
  searchContainer: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginVertical: 10, backgroundColor: C.backgroundSecondary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, color: C.text },
  aiSection: { marginHorizontal: 0, paddingTop: 14, paddingBottom: 6, backgroundColor: "#FFFBF7", borderBottomWidth: 1, borderBottomColor: C.borderLight },
  aiSectionHeader: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, marginBottom: 10 },
  aiSectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: C.text },
  aiLoadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  aiLoadingText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: C.textSecondary },
  aiCardsList: { paddingHorizontal: 16, gap: 12, paddingBottom: 12 },
  aiCard: { width: 130, backgroundColor: "#FFF", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "rgba(232,93,4,0.15)", gap: 6, alignItems: "center", shadowColor: C.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  aiPickBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: C.orange, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start" },
  aiPickText: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: "#FFF" },
  aiCardImage: { width: 64, height: 64, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  aiCardName: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: C.text, textAlign: "center" },
  aiReasonBadge: { backgroundColor: "#FFF7ED", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  aiReasonText: { fontFamily: "Poppins_500Medium", fontSize: 11, color: C.orange },
  aiCardPrice: { fontFamily: "Poppins_700Bold", fontSize: 14, color: C.text },
  aiAddBtn: { flexDirection: "row", alignItems: "center", gap: 3, borderWidth: 1.5, borderColor: C.orange, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  aiAddBtnText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: C.orange },
  aiQtyControl: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF7ED", borderRadius: 8, borderWidth: 1.5, borderColor: C.orange, overflow: "hidden" },
  categoryTabsRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catTab: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: C.backgroundSecondary, borderWidth: 1, borderColor: C.border },
  catTabActive: { backgroundColor: C.orange, borderColor: C.orange },
  catTabText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: C.textSecondary },
  catTabTextActive: { color: "#FFF" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.backgroundSecondary, paddingHorizontal: 16, paddingVertical: 10, borderLeftWidth: 3, borderLeftColor: C.orange },
  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: C.text },
  sectionCount: { fontFamily: "Poppins_400Regular", fontSize: 12, color: C.textSecondary },
  menuItemCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.borderLight, gap: 12, backgroundColor: C.background },
  menuItemLeft: { flex: 1, gap: 4 },
  bestsellerBadge: { alignSelf: "flex-start", backgroundColor: "#FEF3C7", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 4 },
  bestsellerText: { fontFamily: "Poppins_500Medium", fontSize: 10, color: "#D97706", textTransform: "uppercase", letterSpacing: 0.5 },
  menuItemTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  vegBox: { width: 14, height: 14, borderRadius: 2, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  menuItemName: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: C.text, flex: 1 },
  menuItemDesc: { fontFamily: "Poppins_400Regular", fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  menuItemPrice: { fontFamily: "Poppins_700Bold", fontSize: 15, color: C.text, marginTop: 4 },
  menuItemRight: { alignItems: "center", gap: 8 },
  menuItemImage: { width: 80, height: 80, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  addBtn: { borderWidth: 1.5, borderColor: C.orange, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 6, backgroundColor: "#FFF" },
  addBtnText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: C.orange, letterSpacing: 0.5 },
  qtyControl: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF7ED", borderRadius: 8, borderWidth: 1.5, borderColor: C.orange, overflow: "hidden" },
  qtyBtn: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  qtyText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: C.orange, minWidth: 24, textAlign: "center" },
  cartBar: { position: "absolute", left: 16, right: 16, backgroundColor: C.orange, borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: C.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  cartLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cartBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  cartBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: "#FFF" },
  cartText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: "#FFF" },
  cartRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  cartTotal: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#FFF" },
  cartCta: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#FFF" },
  loadingText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: C.textSecondary },
  errorText: { fontFamily: "Poppins_500Medium", fontSize: 16, color: C.errorRed },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: C.textSecondary },
  retryBtn: { backgroundColor: C.orange, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#FFF" },
});
