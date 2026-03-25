import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";

import Colors from "@/constants/colors";

const C = Colors.light;

type SavedOrder = {
  id: string;
  vendorName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  estimatedMinutes: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: "Confirmed", color: "#D97706", bg: "#FEF3C7" },
  RIDER_ASSIGNED: { label: "Rider On Way", color: "#2563EB", bg: "#EFF6FF" },
  PICKED_UP: { label: "Picked Up", color: "#7C3AED", bg: "#F3E8FF" },
  DELIVERED: { label: "Delivered", color: C.successGreen, bg: "#DCFCE7" },
  CANCELLED: { label: "Cancelled", color: C.errorRed, bg: "#FEE2E2" },
};

function OrderCard({ order }: { order: SavedOrder }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.CONFIRMED;
  const date = new Date(order.createdAt);
  const timeStr = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  const isActive = ["CONFIRMED", "RIDER_ASSIGNED", "PICKED_UP"].includes(order.status);

  return (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.8}
      onPress={() => isActive && router.push(`/delivery/${order.id}`)}
    >
      <View style={styles.orderCardTop}>
        <View style={styles.orderVendorIcon}>
          <MaterialCommunityIcons name="store" size={22} color={C.orange} />
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.orderVendorName}>{order.vendorName}</Text>
          <Text style={styles.orderMeta}>{dateStr} · {timeStr}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>
      <View style={styles.orderDivider} />
      <View style={styles.orderCardBottom}>
        <Text style={styles.orderTotal}>₹{order.totalAmount.toFixed(0)}</Text>
        {isActive && (
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={() => router.push(`/delivery/${order.id}`)}
          >
            <Text style={styles.trackBtnText}>Track</Text>
            <Feather name="arrow-right" size={14} color={C.orange} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

async function loadOrders(): Promise<SavedOrder[]> {
  try {
    const raw = await AsyncStorage.getItem("jambites_orders");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: loadOrders,
    refetchInterval: 10000,
  });

  const active = orders.filter((o) =>
    ["CONFIRMED", "RIDER_ASSIGNED", "PICKED_UP"].includes(o.status)
  );
  const past = orders.filter((o) =>
    ["DELIVERED", "CANCELLED"].includes(o.status)
  );

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scroll}
      >
        {isLoading ? null : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bag-outline" size={64} color={C.textMuted} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>
              Order snacks and drinks delivered to your car window
            </Text>
            <TouchableOpacity
              style={styles.browseBtn}
              onPress={() => router.push("/")}
            >
              <Text style={styles.browseBtnText}>Browse Vendors</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Active</Text>
                {active.map((o) => (
                  <OrderCard key={o.id} order={o} />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Past Orders</Text>
                {past.map((o) => (
                  <OrderCard key={o.id} order={o} />
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: Platform.OS === "web" ? 100 : 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 24,
    color: C.text,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: C.textSecondary,
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderCard: {
    backgroundColor: C.backgroundCard,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  orderVendorIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  orderInfo: {
    flex: 1,
  },
  orderVendorName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: C.text,
  },
  orderMeta: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  orderDivider: {
    height: 1,
    backgroundColor: C.borderLight,
    marginHorizontal: 14,
  },
  orderCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  orderTotal: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: C.text,
  },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(232,93,4,0.2)",
  },
  trackBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: C.orange,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: C.text,
  },
  emptySubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    textAlign: "center",
    maxWidth: 260,
  },
  browseBtn: {
    marginTop: 8,
    backgroundColor: C.orange,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#FFF",
  },
});
