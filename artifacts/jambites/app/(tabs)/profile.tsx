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

import Colors from "@/constants/colors";

const C = Colors.light;

function MenuItem({ icon, label, sublabel, onPress, danger }: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: danger ? "#FEE2E2" : "#FFF7ED" }]}>
        <Feather name={icon as any} size={18} color={danger ? C.errorRed : C.orange} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuLabel, danger && { color: C.errorRed }]}>{label}</Text>
        {sublabel && <Text style={styles.menuSublabel}>{sublabel}</Text>}
      </View>
      <Feather name="chevron-right" size={18} color={C.textMuted} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Feather name="user" size={32} color={C.orange} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Guest User</Text>
            <Text style={styles.userPhone}>+91 ••••••7890</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Feather name="edit-2" size={16} color={C.orange} />
          </TouchableOpacity>
        </View>

        {/* Cities */}
        <View style={styles.citiesCard}>
          <Text style={styles.citiesLabel}>Active in</Text>
          <View style={styles.citiesRow}>
            {["Delhi", "Mumbai", "Bengaluru"].map((city) => (
              <View key={city} style={styles.cityChip}>
                <Feather name="map-pin" size={11} color={C.orange} />
                <Text style={styles.cityChipText}>{city}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Sections */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="map-pin" label="Saved Locations" sublabel="Home, Office, Usual spots" />
          <MenuItem icon="credit-card" label="Payment Methods" sublabel="UPI, Cards" />
          <MenuItem icon="tag" label="My Coupons" sublabel="2 active offers" />
        </View>

        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="help-circle" label="Help & FAQ" />
          <MenuItem icon="message-circle" label="Contact Support" />
          <MenuItem icon="star" label="Rate the App" />
        </View>

        <Text style={styles.sectionLabel}>Legal</Text>
        <View style={styles.menuGroup}>
          <MenuItem icon="file-text" label="Terms of Service" />
          <MenuItem icon="shield" label="Privacy Policy" />
        </View>

        <View style={styles.menuGroup}>
          <MenuItem icon="log-out" label="Sign Out" danger />
        </View>

        <View style={styles.footer}>
          <MaterialCommunityIcons name="food-variant" size={20} color={C.textMuted} />
          <Text style={styles.footerText}>Jambites v1.0.0 · Delhi, Mumbai, Bengaluru</Text>
        </View>

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
  userCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: C.backgroundCard,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: C.text,
  },
  userPhone: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  citiesCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#FFF7ED",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(232,93,4,0.15)",
  },
  citiesLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: C.textSecondary,
    marginBottom: 8,
  },
  citiesRow: {
    flexDirection: "row",
    gap: 8,
  },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(232,93,4,0.2)",
  },
  cityChipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: C.orange,
  },
  sectionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  menuGroup: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: C.backgroundCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    flex: 1,
  },
  menuLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: C.text,
  },
  menuSublabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 1,
  },
  footer: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 20,
  },
  footerText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: C.textMuted,
  },
});
