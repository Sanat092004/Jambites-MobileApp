import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Svg, { Line, Circle, Rect, Path, Defs, Pattern, Text as SvgText } from "react-native-svg";

import Colors from "@/constants/colors";

const C = Colors.light;

type OrderStatus = "CONFIRMED" | "RIDER_ASSIGNED" | "PICKED_UP" | "DELIVERED" | "CANCELLED";

const STATUS_STEPS: {
  key: OrderStatus;
  label: string;
  sublabel: string;
  StepIcon: React.ComponentType<{ size: number; color: string }>;
}[] = [
  { key: "CONFIRMED", label: "Order Confirmed", sublabel: "Your order is being prepared", StepIcon: Check },
  { key: "RIDER_ASSIGNED", label: "Rider Assigned", sublabel: "Rider is heading to the vendor", StepIcon: Bike },
  { key: "PICKED_UP", label: "Picked Up", sublabel: "Rider is heading to you!", StepIcon: Navigation },
  { key: "DELIVERED", label: "Delivered", sublabel: "Enjoy your order!", StepIcon: Package },
];

const STATUS_SEQUENCE: OrderStatus[] = ["CONFIRMED", "RIDER_ASSIGNED", "PICKED_UP", "DELIVERED"];

type MapPins = { riderX: number; riderY: number };

function MapView({ riderX, riderY, etaMinutes, isDelivered, pingAnim }: {
  riderX: number;
  riderY: number;
  etaMinutes: number;
  isDelivered: boolean;
  pingAnim: Animated.Value;
}) {
  const W = 340;
  const H = 200;
  const carX = 190;
  const carY = 140;

  const pingScale = pingAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const pingOpacity = pingAnim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.8, 0.3, 0] });

  return (
    <View style={styles.mapContainer}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <Pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <Rect width="32" height="32" fill="#E8F4FB" />
            <Rect x="10" y="0" width="12" height="32" fill="#D0E8F5" rx="1" />
            <Rect x="0" y="10" width="32" height="12" fill="#D0E8F5" rx="1" />
          </Pattern>
        </Defs>
        <Rect width={W} height={H} fill="url(#grid)" />

        {/* Main horizontal road */}
        <Rect x="0" y="120" width={W} height="24" fill="#C8DDE8" rx="2" />
        <Line x1="0" y1="132" x2={W} y2="132" stroke="#B0CCE0" strokeWidth="1" strokeDasharray="8,6" />

        {/* Vertical road */}
        <Rect x="160" y="0" width="20" height={H} fill="#C8DDE8" rx="2" />
        <Line x1="170" y1="0" x2="170" y2={H} stroke="#B0CCE0" strokeWidth="1" strokeDasharray="8,6" />

        {/* Route dotted line from rider to car */}
        <Line
          x1={riderX}
          y1={riderY}
          x2={carX}
          y2={carY}
          stroke={C.orange}
          strokeWidth="2.5"
          strokeDasharray="6,5"
          strokeLinecap="round"
        />

        {/* Car pin pulse ring */}
        <Circle cx={carX} cy={carY} r="18" fill="rgba(37,99,235,0.12)" />
        <Circle cx={carX} cy={carY} r="13" fill="rgba(37,99,235,0.22)" />

        {/* Car pin */}
        <Circle cx={carX} cy={carY} r="14" fill="#2563EB" />
        <Circle cx={carX} cy={carY} r="11" fill="#3B82F6" />
        <SvgText x={carX} y={carY + 5} textAnchor="middle" fontSize="13" fill="white">🚗</SvgText>

        {/* Rider pin */}
        <Circle cx={riderX} cy={riderY} r="14" fill={C.orange} />
        <Circle cx={riderX} cy={riderY} r="11" fill="#FF7A30" />
        <SvgText x={riderX} y={riderY + 5} textAnchor="middle" fontSize="13" fill="white">🛵</SvgText>

        {/* Distance labels */}
        <Rect x="6" y="86" width="62" height="18" rx="9" fill="rgba(255,255,255,0.85)" />
        <SvgText x="37" y="98.5" textAnchor="middle" fontSize="10" fill={C.textSecondary} fontWeight="600">NH-48 Toll</SvgText>

        <Rect x="230" y="50" width="70" height="18" rx="9" fill="rgba(255,255,255,0.85)" />
        <SvgText x="265" y="62.5" textAnchor="middle" fontSize="10" fill={C.textSecondary} fontWeight="600">Sharma Ji</SvgText>
      </Svg>

      {!isDelivered && (
        <View style={styles.etaChip}>
          <Text style={styles.etaChipIcon}>🛵</Text>
          <Text style={styles.etaChipText}>
            {etaMinutes === 0 ? "Arriving now!" : `${etaMinutes} min away`}
          </Text>
        </View>
      )}
    </View>
  );
}

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
          {isDone ? <Check size={12} color="#FFF" /> : <View style={styles.stepDotInner} />}
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
  const [riderX, setRiderX] = useState(80);
  const [riderY, setRiderY] = useState(55);

  const pingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.timing(pingAnim, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true })
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (status === "DELIVERED") return;

    const riderTimer = setInterval(() => {
      setRiderX((prev) => Math.min(prev + 12, 185));
      setRiderY((prev) => Math.min(prev + 9, 135));
    }, 5000);

    const statusTimer = setInterval(() => {
      setStatus((prev) => {
        const idx = STATUS_SEQUENCE.indexOf(prev);
        if (idx < STATUS_SEQUENCE.length - 1) {
          const next = STATUS_SEQUENCE[idx + 1];
          if (next === "DELIVERED") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            clearInterval(riderTimer);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          return next;
        }
        return prev;
      });
      setEtaMinutes((prev) => Math.max(0, prev - 2));
    }, 8000);

    return () => {
      clearInterval(riderTimer);
      clearInterval(statusTimer);
    };
  }, []);

  const isDelivered = status === "DELIVERED";

  const handleCancel = () => {
    Alert.alert("Cancel Order?", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel", style: "destructive",
        onPress: () => { setStatus("CANCELLED"); router.push("/(tabs)/orders"); },
      },
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
        <MapView
          riderX={riderX}
          riderY={riderY}
          etaMinutes={etaMinutes}
          isDelivered={isDelivered}
          pingAnim={pingAnim}
        />

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
              <Text style={styles.reorderBtnText}>Order Again</Text>
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
  mapContainer: { height: 220, marginHorizontal: 16, marginVertical: 12, borderRadius: 16, overflow: "hidden", backgroundColor: "#EBF4FB", position: "relative" },
  etaChip: { position: "absolute", top: 12, alignSelf: "center", left: "50%", transform: [{ translateX: -60 }], flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: C.orange, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, shadowColor: C.orange, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 },
  etaChipIcon: { fontSize: 13 },
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
