import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCircle,
  Navigation,
  Package,
  Bike,
  Star,
  Phone,
  XCircle,
  Map,
  Car,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";

const C = Colors.light;

type OrderStatus = "CONFIRMED" | "RIDER_ASSIGNED" | "PICKED_UP" | "DELIVERED" | "CANCELLED";

const STATUS_STEPS: { key: OrderStatus; label: string; sublabel: string; StepIcon: React.ComponentType<{ size: number; color: string }> }[] = [
  { key: "CONFIRMED", label: "Order Confirmed", sublabel: "Your order is being prepared", StepIcon: Check },
  { key: "RIDER_ASSIGNED", label: "Rider Assigned", sublabel: "Rider is heading to the vendor", StepIcon: Bike },
  { key: "PICKED_UP", label: "Picked Up", sublabel: "Rider is heading to you!", StepIcon: Navigation },
  { key: "DELIVERED", label: "Delivered", sublabel: "Enjoy your order!", StepIcon: Package },
];

const STATUS_SEQUENCE: OrderStatus[] = ["CONFIRMED", "RIDER_ASSIGNED", "PICKED_UP", "DELIVERED"];

function StatusStep({ step, currentStatus, index }: {
  step: typeof STATUS_STEPS[0];
  currentStatus: OrderStatus;
  index: number;
}) {
  const currentIdx = STATUS_SEQUENCE.indexOf(currentStatus);
  const stepIdx = STATUS_SEQUENCE.indexOf(step.key);
  const isDone = stepIdx <= currentIdx;
  const isActive = stepIdx === currentIdx;

  return (
    <View style={styles.stepRow}>
      <View style={styles.stepLeft}>
        <View style={[styles.stepDot, isDone && styles.stepDotDone, isActive && styles.stepDotActive]}>
          {isDone
            ? <Check size={12} color="#FFF" />
            : <View style={styles.stepDotInner} />
          }
        </View>
        {index < STATUS_STEPS.length - 1 && (
          <View style={[styles.stepLine, isDone && styles.stepLineDone]} />
        )}
      </View>
      <View style={styles.stepContent}>
        <Text style={[styles.stepLabel, isActive && styles.stepLabelActive, isDone && !isActive && styles.stepLabelDone]}>
          {step.label}
        </Text>
        {isActive && <Text style={styles.stepSublabel}>{step.sublabel}</Text>}
      </View>
      {isActive && <step.StepIcon size={20} color={C.orange} />}
    </View>
  );
}

export default function DeliveryScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [status, setStatus] = useState<OrderStatus>("CONFIRMED");
  const [etaMinutes, setEtaMinutes] = useState(6);
  const [rating, setRating] = useState(0);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (status === "DELIVERED") return;
    const timer = setInterval(() => {
      setStatus((prev) => {
        const idx = STATUS_SEQUENCE.indexOf(prev);
        if (idx < STATUS_SEQUENCE.length - 1) {
          const next = STATUS_SEQUENCE[idx + 1];
          if (next === "DELIVERED") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return next;
        }
        clearInterval(timer);
        return prev;
      });
      setEtaMinutes((prev) => Math.max(0, prev - 2));
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const isDelivered = status === "DELIVERED";

  const handleCancel = () => {
    Alert.alert("Cancel Order?", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      { text: "Yes, Cancel", style: "destructive", onPress: () => { setStatus("CANCELLED"); router.push("/(tabs)/orders"); } },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/orders")} style={styles.backBtn}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Tracking</Text>
        <TouchableOpacity style={styles.helpBtn} onPress={() => router.push("/(tabs)/chat")}>
          <Bot size={22} color={C.orange} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Map size={48} color={C.textMuted} />
            <Text style={styles.mapText}>Live map tracking</Text>
            <Text style={styles.mapSubText}>Available in native app</Text>
          </View>

          <View style={styles.carPin}>
            <Animated.View style={[styles.pingRing, { transform: [{ scale: pulseAnim }] }]} />
            <View style={styles.carPinInner}>
              <Car size={18} color="#FFF" />
            </View>
          </View>

          <View style={styles.riderPin}>
            <View style={styles.riderPinInner}>
              <Bike size={18} color="#FFF" />
            </View>
          </View>

          {!isDelivered && (
            <View style={styles.etaChipMap}>
              <Bike size={14} color="#FFF" />
              <Text style={styles.etaChipText}>
                {etaMinutes === 0 ? "Arriving now!" : `${etaMinutes} min away`}
              </Text>
            </View>
          )}
        </View>

        {isDelivered && (
          <View style={styles.deliveredCard}>
            <View style={styles.deliveredIcon}>
              <CheckCircle size={36} color={C.successGreen} />
            </View>
            <Text style={styles.deliveredTitle}>Order Delivered!</Text>
            <Text style={styles.deliveredSub}>Rate your experience</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => { setRating(star); Haptics.selectionAsync(); }}>
                  <Star size={32} color={star <= rating ? C.amber : C.border} fill={star <= rating ? C.amber : "transparent"} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.reorderBtn} onPress={() => router.push("/")}>
              <Text style={styles.reorderBtnText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Status</Text>
          <Text style={styles.orderId}>Order #{orderId}</Text>
          {STATUS_STEPS.map((step, idx) => (
            <StatusStep key={step.key} step={step} currentStatus={status} index={idx} />
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Rider</Text>
          <View style={styles.riderRow}>
            <View style={styles.riderAvatar}>
              <Bike size={24} color={C.orange} />
            </View>
            <View style={styles.riderInfo}>
              <Text style={styles.riderName}>Rajesh Kumar</Text>
              <View style={styles.riderMeta}>
                <Star size={12} color={C.amber} fill={C.amber} />
                <Text style={styles.riderRating}>4.8 · </Text>
                <Text style={styles.vehicleNum}>DL-01-ZY-4567</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Phone size={18} color={C.orange} />
            </TouchableOpacity>
          </View>
        </View>

        {status === "CONFIRMED" && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <XCircle size={16} color={C.errorRed} />
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.backgroundSecondary, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: C.text },
  helpBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center" },
  scroll: { paddingBottom: 40 },
  mapContainer: { height: 220, backgroundColor: "#E8F4F8", margin: 16, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center", position: "relative" },
  mapPlaceholder: { alignItems: "center", gap: 8 },
  mapText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: C.textSecondary },
  mapSubText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: C.textMuted },
  carPin: { position: "absolute", bottom: 60, left: "35%", alignItems: "center", justifyContent: "center" },
  pingRing: { position: "absolute", width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(37,99,235,0.2)", borderWidth: 2, borderColor: "rgba(37,99,235,0.4)" },
  carPinInner: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.riderBlue, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  riderPin: { position: "absolute", top: 50, right: "30%", alignItems: "center", justifyContent: "center" },
  riderPinInner: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.orange, alignItems: "center", justifyContent: "center", shadowColor: C.orange, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 4 },
  etaChipMap: { position: "absolute", top: 12, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.orange, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  etaChipText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#FFF" },
  deliveredCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: "#F0FDF4", borderRadius: 16, padding: 24, alignItems: "center", gap: 10, borderWidth: 1, borderColor: "rgba(45,155,78,0.2)" },
  deliveredIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center" },
  deliveredTitle: { fontFamily: "Poppins_700Bold", fontSize: 22, color: C.text },
  deliveredSub: { fontFamily: "Poppins_400Regular", fontSize: 14, color: C.textSecondary },
  starsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  reorderBtn: { backgroundColor: C.orange, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  reorderBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#FFF" },
  card: { backgroundColor: C.background, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: C.text, marginBottom: 4 },
  orderId: { fontFamily: "Poppins_400Regular", fontSize: 12, color: C.textSecondary, marginBottom: 14 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 44 },
  stepLeft: { alignItems: "center", width: 24 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.border, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.border },
  stepDotDone: { backgroundColor: C.orange, borderColor: C.orange },
  stepDotActive: { backgroundColor: C.orange, borderColor: C.amber },
  stepDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  stepLine: { width: 2, flex: 1, backgroundColor: C.border, minHeight: 20, marginVertical: 2 },
  stepLineDone: { backgroundColor: C.orange },
  stepContent: { flex: 1, paddingBottom: 14 },
  stepLabel: { fontFamily: "Poppins_400Regular", fontSize: 14, color: C.textMuted, marginTop: 3 },
  stepLabelActive: { fontFamily: "Poppins_600SemiBold", color: C.orange },
  stepLabelDone: { fontFamily: "Poppins_500Medium", color: C.textSecondary },
  stepSublabel: { fontFamily: "Poppins_400Regular", fontSize: 12, color: C.textSecondary, marginTop: 2 },
  riderRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  riderAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center" },
  riderInfo: { flex: 1 },
  riderName: { fontFamily: "Poppins_600SemiBold", fontSize: 16, color: C.text },
  riderMeta: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  riderRating: { fontFamily: "Poppins_400Regular", fontSize: 12, color: C.textSecondary },
  vehicleNum: { fontFamily: "Poppins_400Regular", fontSize: 12, color: C.textSecondary },
  callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFF7ED", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(232,93,4,0.2)" },
  cancelBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginBottom: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "rgba(214,40,57,0.2)" },
  cancelBtnText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: C.errorRed },
});
