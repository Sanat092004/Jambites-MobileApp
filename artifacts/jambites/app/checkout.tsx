import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, MapPin, Check, Zap, Store, CreditCard, Banknote, Landmark, ShoppingCart } from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";
import { useCart } from "@/context/CartContext";

const C = Colors.light;

const PAYMENT_METHODS = [
  { id: "UPI", Icon: Landmark, label: "UPI" },
  { id: "Card", Icon: CreditCard, label: "Card" },
  { id: "Cash", Icon: Banknote, label: "Cash" },
] as const;

type PaymentMethod = "UPI" | "Card" | "Cash";

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { items, vendorId, vendorName, totalPrice, clearCart } = useCart();
  const [carNumber, setCarNumber] = useState("");
  const [landmark, setLandmark] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("UPI");
  const [isPlacing, setIsPlacing] = useState(false);
  const [promoError, setPromoError] = useState("");

  const deliveryFee = 15;
  const platformFee = 2;
  const taxes = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + deliveryFee + platformFee + taxes - discount;

  const applyPromo = () => {
    if (promoCode.toLowerCase() === "jambites10") {
      setDiscount(Math.round(totalPrice * 0.1));
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError("Invalid promo code");
      setPromoApplied(false);
      setDiscount(0);
    }
  };

  const placeOrder = async () => {
    if (!carNumber.trim()) {
      Alert.alert("Required", "Please enter your car number plate");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Add items to your cart first");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPlacing(true);

    try {
      const url = getApiUrl();
      const res = await fetch(`${url}api/jambites/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          items: items.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
          deliveryLat: 28.6139,
          deliveryLng: 77.209,
          landmark: landmark.trim(),
          carNumber: carNumber.trim().toUpperCase(),
          paymentMethod: payment,
        }),
      });

      if (!res.ok) throw new Error("Failed to place order");
      const order = await res.json() as { id: string; vendorName: string; status: string; totalAmount: number; estimatedMinutes: number; createdAt: string };

      const savedRaw = await AsyncStorage.getItem("jambites_orders");
      const saved = savedRaw ? JSON.parse(savedRaw) : [];
      saved.unshift({
        id: order.id,
        vendorName: order.vendorName,
        status: order.status,
        totalAmount: grandTotal,
        estimatedMinutes: order.estimatedMinutes,
        createdAt: order.createdAt || new Date().toISOString(),
      });
      await AsyncStorage.setItem("jambites_orders", JSON.stringify(saved));

      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/delivery/${order.id}`);
    } catch {
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <X size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyCentered}>
          <ShoppingCart size={60} color={C.textMuted} />
          <Text style={styles.emptyTitle}>Cart is empty</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/")}>
            <Text style={styles.browseBtnText}>Browse Vendors</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <X size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.vendorBadge}>
          <Store size={16} color={C.orange} />
          <Text style={styles.vendorBadgeText}>{vendorName}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.orderItemLeft}>
                <View style={[styles.vegDotSmall, { backgroundColor: item.isVeg ? C.vegGreen : C.nonVegRed }]} />
                <Text style={styles.orderItemName} numberOfLines={1}>{item.name}</Text>
                <View style={styles.qtyTag}>
                  <Text style={styles.qtyTagText}>×{item.quantity}</Text>
                </View>
              </View>
              <Text style={styles.orderItemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Location</Text>
          <View style={styles.locationInfo}>
            <MapPin size={16} color={C.orange} />
            <Text style={styles.locationText}>Near Toll Plaza, NH-48 · 3rd lane</Text>
          </View>
          <Text style={styles.cardLabel}>Car Number Plate *</Text>
          <TextInput
            style={[styles.input, !carNumber.trim() && styles.inputRequired]}
            placeholder="e.g. DL 01 AB 1234"
            placeholderTextColor={C.textMuted}
            value={carNumber}
            onChangeText={(t) => setCarNumber(t.toUpperCase())}
            autoCapitalize="characters"
            maxLength={15}
          />
          <Text style={styles.cardLabel}>Landmark / Lane Info</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder="e.g. Near green truck, lane 2 from divider"
            placeholderTextColor={C.textMuted}
            value={landmark}
            onChangeText={setLandmark}
            maxLength={100}
            multiline
          />
          <Text style={styles.helperText}>Help your rider find you faster</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Promo Code</Text>
          <View style={styles.promoRow}>
            <TextInput
              style={[styles.promoInput, promoApplied && styles.promoInputSuccess]}
              placeholder="Try JAMBITES10 for 10% off"
              placeholderTextColor={C.textMuted}
              value={promoCode}
              onChangeText={(t) => {
                setPromoCode(t);
                setPromoError("");
                if (promoApplied) { setPromoApplied(false); setDiscount(0); }
              }}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.applyBtn, promoApplied && styles.applyBtnSuccess]}
              onPress={applyPromo}
            >
              {promoApplied
                ? <Check size={16} color="#FFF" />
                : <Text style={styles.applyBtnText}>Apply</Text>
              }
            </TouchableOpacity>
          </View>
          {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}
          {promoApplied ? <Text style={styles.promoSuccess}>-₹{discount} savings applied!</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Breakdown</Text>
          {[
            { label: "Item Total", value: `₹${totalPrice}` },
            { label: "Delivery Fee", value: `₹${deliveryFee}` },
            { label: "Platform Fee", value: `₹${platformFee}` },
            { label: "Taxes (5%)", value: `₹${taxes}` },
          ].map((row) => (
            <View key={row.label} style={styles.priceRow}>
              <Text style={styles.priceLabel}>{row.label}</Text>
              <Text style={styles.priceValue}>{row.value}</Text>
            </View>
          ))}
          {discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: C.successGreen }]}>Promo Discount</Text>
              <Text style={[styles.priceValue, { color: C.successGreen }]}>-₹{discount}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{grandTotal}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>
          <View style={styles.paymentRow}>
            {PAYMENT_METHODS.map(({ id, Icon, label }) => (
              <TouchableOpacity
                key={id}
                style={[styles.paymentOption, payment === id && styles.paymentOptionSelected]}
                onPress={() => setPayment(id)}
              >
                <Icon size={20} color={payment === id ? "#FFF" : C.textSecondary} />
                <Text style={[styles.paymentLabel, payment === id && styles.paymentLabelSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === "web" ? 24 : insets.bottom + 12 }]}>
        <View style={styles.etaChip}>
          <Zap size={13} color={C.orange} />
          <Text style={styles.etaText}>Estimated delivery: ~6 min</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, (!carNumber.trim() || isPlacing) && styles.placeOrderBtnDisabled]}
          onPress={placeOrder}
          disabled={!carNumber.trim() || isPlacing}
        >
          {isPlacing
            ? <ActivityIndicator color="#FFF" size="small" />
            : <Text style={styles.placeOrderBtnText}>Place Order — ₹{grandTotal}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.backgroundSecondary },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.background, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.backgroundSecondary, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: C.text },
  scroll: { paddingTop: 12, paddingHorizontal: 16 },
  vendorBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF7ED", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: "rgba(232,93,4,0.2)" },
  vendorBadgeText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: C.orange },
  card: { backgroundColor: C.background, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: C.text, marginBottom: 12 },
  orderItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  orderItemLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  vegDotSmall: { width: 8, height: 8, borderRadius: 4 },
  orderItemName: { fontFamily: "Poppins_400Regular", fontSize: 14, color: C.text, flex: 1 },
  qtyTag: { backgroundColor: C.backgroundSecondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  qtyTagText: { fontFamily: "Poppins_500Medium", fontSize: 12, color: C.textSecondary },
  orderItemPrice: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: C.text },
  locationInfo: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.backgroundSecondary, borderRadius: 10, padding: 10, marginBottom: 12 },
  locationText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: C.text, flex: 1 },
  cardLabel: { fontFamily: "Poppins_500Medium", fontSize: 13, color: C.textSecondary, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: C.backgroundSecondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Poppins_400Regular", fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border, marginBottom: 8 },
  inputRequired: { borderColor: "rgba(232,93,4,0.4)" },
  inputMulti: { minHeight: 70, textAlignVertical: "top" },
  helperText: { fontFamily: "Poppins_400Regular", fontSize: 11, color: C.textMuted, marginTop: -4 },
  promoRow: { flexDirection: "row", gap: 8 },
  promoInput: { flex: 1, backgroundColor: C.backgroundSecondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Poppins_400Regular", fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
  promoInputSuccess: { borderColor: C.successGreen, backgroundColor: "#F0FDF4" },
  applyBtn: { backgroundColor: C.orange, borderRadius: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  applyBtnSuccess: { backgroundColor: C.successGreen },
  applyBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#FFF" },
  promoError: { fontFamily: "Poppins_400Regular", fontSize: 12, color: C.errorRed, marginTop: 4 },
  promoSuccess: { fontFamily: "Poppins_500Medium", fontSize: 12, color: C.successGreen, marginTop: 4 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  priceLabel: { fontFamily: "Poppins_400Regular", fontSize: 14, color: C.textSecondary },
  priceValue: { fontFamily: "Poppins_500Medium", fontSize: 14, color: C.text },
  totalRow: { borderBottomWidth: 0, marginTop: 4, paddingTop: 10 },
  totalLabel: { fontFamily: "Poppins_700Bold", fontSize: 16, color: C.text },
  totalValue: { fontFamily: "Poppins_700Bold", fontSize: 18, color: C.orange },
  paymentRow: { flexDirection: "row", gap: 10 },
  paymentOption: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: C.backgroundSecondary, borderWidth: 1.5, borderColor: C.border },
  paymentOptionSelected: { backgroundColor: C.orange, borderColor: C.orange },
  paymentLabel: { fontFamily: "Poppins_500Medium", fontSize: 13, color: C.textSecondary },
  paymentLabelSelected: { color: "#FFF" },
  bottomBar: { backgroundColor: C.background, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.borderLight, gap: 10 },
  etaChip: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#FFF7ED", borderRadius: 20, paddingVertical: 6 },
  etaText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: C.orange },
  placeOrderBtn: { backgroundColor: C.orange, borderRadius: 16, paddingVertical: 16, alignItems: "center", shadowColor: C.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  placeOrderBtnDisabled: { backgroundColor: C.textMuted, shadowOpacity: 0 },
  placeOrderBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#FFF" },
  emptyCentered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: C.text },
  browseBtn: { backgroundColor: C.orange, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  browseBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#FFF" },
});
