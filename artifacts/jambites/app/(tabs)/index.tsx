import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";
import { useCart } from "@/context/CartContext";

const C = Colors.light;

type Vendor = {
  id: string;
  name: string;
  description: string;
  rating: number;
  deliveryTimeMin: number;
  deliveryFee: number;
  distance: number;
  isOpen: boolean;
  category: string;
};

const CATEGORIES = [
  { id: "All", icon: "food-variant", label: "All" },
  { id: "Snacks", icon: "cookie", label: "Snacks" },
  { id: "Drinks", icon: "cup", label: "Drinks" },
  { id: "Medicines", icon: "pill", label: "Medicines" },
  { id: "Combos", icon: "food", label: "Combos" },
] as const;

const CITY_OPTIONS = ["Delhi", "Mumbai", "Bengaluru"];

async function fetchVendors(): Promise<Vendor[]> {
  const url = getApiUrl();
  const res = await fetch(`${url}api/jambites/vendors`);
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      <Feather name="star" size={12} color={C.amber} />
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    </View>
  );
}

function CategoryPill({ id, icon, label, selected, onPress }: { id: string; icon: string; label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.categoryPill, selected && styles.categoryPillSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={selected ? "#FFF" : C.orange}
      />
      <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/menu/${vendor.id}`);
  }, [vendor.id]);

  const categoryColor =
    vendor.category === "Medicines"
      ? "#EEF2FF"
      : vendor.category === "Drinks"
      ? "#EFF6FF"
      : "#FFF7ED";
  const categoryTextColor =
    vendor.category === "Medicines"
      ? "#6366F1"
      : vendor.category === "Drinks"
      ? "#2563EB"
      : C.orange;

  return (
    <TouchableOpacity
      style={[styles.vendorCard, !vendor.isOpen && styles.vendorCardClosed]}
      onPress={handlePress}
      activeOpacity={0.85}
      disabled={!vendor.isOpen}
    >
      <View style={styles.vendorCardInner}>
        <View style={[styles.vendorImagePlaceholder, { backgroundColor: categoryColor }]}>
          <MaterialCommunityIcons
            name={
              vendor.category === "Medicines"
                ? "pill"
                : vendor.category === "Drinks"
                ? "cup"
                : "food-variant"
            }
            size={36}
            color={categoryTextColor}
          />
        </View>
        <View style={styles.vendorInfo}>
          <View style={styles.vendorTopRow}>
            <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
            {!vendor.isOpen && (
              <View style={styles.closedBadge}>
                <Text style={styles.closedText}>Closed</Text>
              </View>
            )}
          </View>
          <Text style={styles.vendorDescription} numberOfLines={1}>
            {vendor.description}
          </Text>
          <View style={styles.vendorMetaRow}>
            <StarRating rating={vendor.rating} />
            <View style={styles.dot} />
            <Feather name="clock" size={11} color={C.textSecondary} />
            <Text style={styles.metaText}>{vendor.deliveryTimeMin} min</Text>
            <View style={styles.dot} />
            <Text style={styles.metaText}>{Math.round(vendor.distance * 1000)}m</Text>
          </View>
          <View style={styles.vendorBottomRow}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={[styles.categoryBadgeText, { color: categoryTextColor }]}>
                {vendor.category}
              </Text>
            </View>
            <Text style={styles.deliveryFee}>₹{vendor.deliveryFee} delivery</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={C.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [jamDetected] = useState(true);
  const { totalItems, totalPrice } = useCart();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    retry: 2,
  });

  const filtered =
    selectedCategory === "All"
      ? vendors
      : vendors.filter((v) => v.category === selectedCategory);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.citySelector}
          onPress={() => setCityDropdownOpen(!cityDropdownOpen)}
        >
          <Text style={styles.appName}>Jambites</Text>
          <View style={styles.cityRow}>
            <Feather name="map-pin" size={12} color={C.orange} />
            <Text style={styles.cityText}>{selectedCity}</Text>
            <Feather name="chevron-down" size={12} color={C.textSecondary} />
          </View>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.push("/chat")}>
            <Feather name="bell" size={22} color={C.darkNavy} />
          </TouchableOpacity>
        </View>
      </View>

      {/* City Dropdown */}
      {cityDropdownOpen && (
        <View style={styles.cityDropdown}>
          {CITY_OPTIONS.map((city) => (
            <TouchableOpacity
              key={city}
              style={styles.cityOption}
              onPress={() => {
                setSelectedCity(city);
                setCityDropdownOpen(false);
              }}
            >
              <Feather name="map-pin" size={14} color={C.orange} />
              <Text style={[styles.cityOptionText, city === selectedCity && styles.cityOptionSelected]}>
                {city}
              </Text>
              {city === selectedCity && <Feather name="check" size={14} color={C.orange} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        style={styles.scroll}
      >
        {/* Jam Banner */}
        {jamDetected ? (
          <View style={styles.jamBanner}>
            <View style={styles.jamBannerLeft}>
              <MaterialCommunityIcons name="traffic-light" size={28} color="#FFF" />
              <View style={styles.jamBannerText}>
                <Text style={styles.jamBannerTitle}>Jam detected near you!</Text>
                <Text style={styles.jamBannerSub}>Order now — delivery in under 7 min</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.jamOrderBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <Text style={styles.jamOrderBtnText}>Order</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noJamBanner}>
            <Feather name="clock" size={20} color={C.orange} />
            <Text style={styles.noJamText}>Schedule order for your next commute</Text>
          </View>
        )}

        {/* Location Card */}
        <View style={styles.locationCard}>
          <Feather name="map-pin" size={16} color={C.orange} />
          <View style={styles.locationText}>
            <Text style={styles.locationTitle}>Your car is at</Text>
            <Text style={styles.locationAddress}>Near Toll Plaza, NH-48 · 3rd lane</Text>
          </View>
          <TouchableOpacity style={styles.adjustBtn}>
            <Text style={styles.adjustBtnText}>Adjust</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat.id}
              id={cat.id}
              icon={cat.icon}
              label={cat.label}
              selected={selectedCategory === cat.id}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCategory(cat.id);
              }}
            />
          ))}
        </ScrollView>

        {/* Vendors */}
        <View style={styles.vendorsHeader}>
          <Text style={styles.sectionTitle}>Vendors Nearby</Text>
          <Text style={styles.vendorCount}>{filtered.length} open</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={C.orange} />
            <Text style={styles.loadingText}>Finding vendors near you...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="store-off" size={48} color={C.textMuted} />
            <Text style={styles.emptyText}>No vendors in this category right now</Text>
          </View>
        ) : (
          filtered.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))
        )}

        <View style={{ height: Platform.OS === "web" ? 100 : 100 }} />
      </ScrollView>

      {/* Cart Bar */}
      {totalItems > 0 && (
        <Pressable
          style={[styles.cartBar, { bottom: Platform.OS === "web" ? 84 + 16 : insets.bottom + 80 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/checkout");
          }}
        >
          <View style={styles.cartLeft}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
            <Text style={styles.cartItemsText}>{totalItems} item{totalItems > 1 ? "s" : ""} in cart</Text>
          </View>
          <View style={styles.cartRight}>
            <Text style={styles.cartTotal}>₹{totalPrice}</Text>
            <Feather name="chevron-right" size={18} color="#FFF" />
          </View>
        </Pressable>
      )}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.background,
  },
  citySelector: {
    flex: 1,
  },
  appName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: C.orange,
    lineHeight: 28,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cityText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: C.textSecondary,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  cityDropdown: {
    marginHorizontal: 16,
    backgroundColor: C.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
    marginBottom: 8,
  },
  cityOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  cityOptionText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    color: C.text,
    flex: 1,
  },
  cityOptionSelected: {
    fontFamily: "Poppins_600SemiBold",
    color: C.orange,
  },
  scroll: {
    flex: 1,
  },
  jamBanner: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: C.orange,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  jamBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  jamBannerText: {
    flex: 1,
  },
  jamBannerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#FFF",
  },
  jamBannerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  jamOrderBtn: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  jamOrderBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#FFF",
  },
  noJamBanner: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noJamText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: C.orange,
  },
  locationCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: C.backgroundSecondary,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: C.textSecondary,
  },
  locationAddress: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: C.text,
  },
  adjustBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: C.border,
  },
  adjustBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: C.orange,
  },
  sectionTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 17,
    color: C.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesRow: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: "#FFF7ED",
    borderWidth: 1.5,
    borderColor: "rgba(232,93,4,0.2)",
  },
  categoryPillSelected: {
    backgroundColor: C.orange,
    borderColor: C.orange,
  },
  categoryLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: C.orange,
  },
  categoryLabelSelected: {
    color: "#FFF",
  },
  vendorsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  vendorCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: C.textSecondary,
  },
  vendorCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: C.backgroundCard,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  vendorCardClosed: {
    opacity: 0.5,
  },
  vendorCardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  vendorImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  vendorInfo: {
    flex: 1,
    gap: 3,
  },
  vendorTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  vendorName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: C.text,
    flex: 1,
  },
  closedBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  closedText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: C.errorRed,
  },
  vendorDescription: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: C.textSecondary,
  },
  vendorMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: C.amber,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.textMuted,
  },
  metaText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: C.textSecondary,
  },
  vendorBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
  },
  deliveryFee: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: C.textSecondary,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: C.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: C.textSecondary,
  },
  cartBar: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: C.orange,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: C.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cartLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cartBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: "#FFF",
  },
  cartItemsText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#FFF",
  },
  cartRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cartTotal: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#FFF",
  },
});
