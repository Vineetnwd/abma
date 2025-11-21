import { FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const { width } = Dimensions.get("window");

// Army Combat Color Palette
const COLORS = {
  primary: '#4A5D23',        // Olive green
  secondary: '#6B7F3A',      // Lighter olive
  accent: '#8B7355',         // Tan/Brown
  dark: '#2C3E1F',          // Dark green
  white: '#FFFFFF',
  gray: '#5C5C5C',          // Medium gray
  lightGray: '#D4CEBA',     // Khaki
  error: '#8B4513',          // Saddle brown
  success: '#5D7C2F',        // Military green
  warning: '#C87533',        // Burnt orange
  background: '#F5F3EE',     // Off-white/Beige
  cardBg: '#FAFAF7',        // Light beige
  textPrimary: '#2C2C2C',    // Dark gray
  textSecondary: '#5C5C5C',  // Medium gray
  border: '#D4CEBA',         // Khaki border
  borderLight: '#E5E1D3',    // Light khaki
};

export default function StudentFeeScreen() {
  const router = useRouter();
  const {
    student_id,
    student_name,
    student_class,
    student_section,
    admission_no,
  } = useLocalSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [studentInfo, setStudentInfo] = useState({
    id: student_id || "",
    name: student_name || "Student Name",
    class: student_class || "",
    section: student_section || "",
    admissionNo: admission_no || "",
  });

  const [selectedMonths, setSelectedMonths] = useState([]);

  // Fetch fee data from API
  useEffect(() => {
    fetchFeeData();
  }, [student_id]);

  const fetchFeeData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!student_id) {
        throw new Error("Student ID is required");
      }

      const response = await axios.post(
        "https://abma.org.in/binex/api.php?task=student_fee",
        {
          student_id: student_id,
        }
      );

      if (response.data) {
        const processedData = {};
        Object.entries(response.data).forEach(([month, fees]) => {
          processedData[month] = {
            ...fees,
            total:
              typeof fees.total === "number"
                ? fees.total
                : parseFloat(fees.total) || 0,
            status: fees.status || "UNPAID",
          };
        });

        setFeeData(processedData);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error fetching fee data:", err);
      setError(err.message || "Failed to load fee data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total fees
  const calculateTotals = () => {
    if (!feeData) return { total: 0, paid: 0, pending: 0 };

    const total = Object.values(feeData).reduce((sum, month) => {
      const monthTotal =
        typeof month.total === "number"
          ? month.total
          : parseFloat(month.total) || 0;
      return sum + monthTotal;
    }, 0);

    const paid = Object.values(feeData).reduce((sum, month) => {
      if (month.status !== "PAID") return sum;
      const monthTotal =
        typeof month.total === "number"
          ? month.total
          : parseFloat(month.total) || 0;
      return sum + monthTotal;
    }, 0);

    return {
      total: isNaN(total) ? 0 : total,
      paid: isNaN(paid) ? 0 : paid,
      pending: isNaN(total - paid) ? 0 : total - paid,
    };
  };

  const { total, paid, pending } = calculateTotals();

  // Toggle month selection
  const toggleMonthSelection = (month) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (feeData[month].status === "PAID") return;

    setSelectedMonths((prev) => {
      if (prev.includes(month)) {
        return prev.filter((m) => m !== month);
      } else {
        return [...prev, month];
      }
    });
  };

  // Get months ordered chronologically
  const getOrderedMonths = () => {
    if (!feeData) return [];

    const months = Object.keys(feeData);
    const monthOrder = [
      "Admission_month",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
      "January",
      "February",
      "March",
    ];

    return months.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
  };

  // Render fee card for each month
  const renderFeeCard = (month, index) => {
    if (!feeData) return null;

    const monthData = feeData[month];
    const isPaid = monthData.status === "PAID";
    const isSelected = selectedMonths.includes(month);

    if (!monthData) return null;

    return (
      <Animated.View
        key={month}
        entering={FadeInDown.delay(index * 100).springify()}
        style={styles.feeCard}
      >
        <TouchableOpacity
          style={[
            styles.feeCardContent,
            isPaid ? styles.paidCard : null,
            isSelected ? styles.selectedCard : null,
          ]}
          onPress={() => toggleMonthSelection(month)}
          disabled={isPaid}
          activeOpacity={0.8}
        >
          <View style={styles.feeCardHeader}>
            <View style={styles.monthTitleContainer}>
              <View style={styles.monthDot} />
              <View>
                <Text style={styles.monthTitle}>
                  {month === "Admission_month" ? "ADMISSION FEES" : month.toUpperCase()}
                </Text>
                {month === "Admission_month" ? (
                  <View style={styles.oneTimeBadge}>
                    <Text style={styles.oneTimeLabel}>ONE TIME</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.feeStatus}>
              {isPaid ? (
                <View style={styles.paidStatusPill}>
                  <FontAwesome5
                    name="check-circle"
                    size={12}
                    color={COLORS.success}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.paidStatusText}>PAID</Text>
                </View>
              ) : isSelected ? (
                <View style={styles.selectedStatusPill}>
                  <FontAwesome5 name="check" size={12} color={COLORS.white} />
                </View>
              ) : (
                <View style={styles.pendingStatusPill}>
                  <Text style={styles.pendingStatusText}>UNPAID</Text>
                </View>
              )}

              <Text style={styles.totalAmount}>₹{monthData.total}</Text>
            </View>
          </View>

          {/* Fee breakdown */}
          <View style={styles.feeBreakdown}>
            {Object.entries(monthData).map(([key, value]) => {
              if (key === "total" || key === "status") return null;

              const formattedLabel = key
                .replace(/_/g, " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

              return (
                <View key={key} style={styles.feeItem}>
                  <View style={styles.feeItemLeft}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.feeLabel}>{formattedLabel}</Text>
                  </View>
                  <Text style={styles.feeValue}>₹{value}</Text>
                </View>
              );
            })}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.dark, COLORS.primary, COLORS.secondary]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome5 name="arrow-left" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>STUDENT FEES</Text>
            <View style={styles.headerUnderline} />
          </View>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => {
              Alert.alert(
                "Fee Information",
                "This screen shows the fee details for the selected student. You can select pending months and pay them together.",
                [{ text: "OK" }]
              );
            }}
          >
            <FontAwesome5 name="info-circle" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Student Info Card */}
      <Animated.View
        entering={FadeInUp.delay(200).springify()}
        style={styles.studentInfoCard}
      >
        <View style={styles.studentDetail}>
          <Text style={styles.studentName}>{studentInfo.name}</Text>
          <View style={styles.studentInfoRow}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <FontAwesome5
                  name="graduation-cap"
                  size={10}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.infoText}>
                Class {studentInfo.class}-{studentInfo.section}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <FontAwesome5
                  name="id-badge"
                  size={10}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.infoText}>
                {studentInfo.admissionNo || `ID: ${studentInfo.id}`}
              </Text>
            </View>
          </View>
        </View>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.studentAvatar}
        >
          <Text style={styles.avatarText}>{studentInfo.name.charAt(0)}</Text>
          <View style={styles.avatarBadge}>
            <View style={styles.avatarDot} />
          </View>
        </LinearGradient>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>LOADING FEE DETAILS...</Text>
          <View style={styles.loadingBadge}>
            <Text style={styles.loadingBadgeText}>TACTICAL LOADING</Text>
          </View>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <FontAwesome5 name="exclamation-triangle" size={50} color={COLORS.error} />
          </View>
          <Text style={styles.errorTitle}>ERROR LOADING DATA</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFeeData}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.retryButtonGradient}
            >
              <View style={styles.buttonStripe} />
              <Text style={styles.retryButtonText}>RETRY</Text>
              <FontAwesome5 name="redo" size={14} color={COLORS.white} style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Fee Summary Cards */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.summaryCardsContainer}
          >
            <View style={[styles.summaryCard, { backgroundColor: COLORS.cardBg }]}>
              <View style={styles.summaryCardHeader}>
                <FontAwesome5
                  name="rupee-sign"
                  size={16}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.summaryValue}>₹{total.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>TOTAL FEES</Text>
              <View style={styles.summaryStripe} />
            </View>

            <View style={[styles.summaryCard, { backgroundColor: COLORS.cardBg }]}>
              <View style={styles.summaryCardHeader}>
                <FontAwesome5
                  name="check-circle"
                  size={16}
                  color={COLORS.success}
                />
              </View>
              <Text style={styles.summaryValue}>₹{paid.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>PAID</Text>
              <View style={[styles.summaryStripe, { backgroundColor: COLORS.success }]} />
            </View>

            <View style={[styles.summaryCard, { backgroundColor: COLORS.cardBg }]}>
              <View style={styles.summaryCardHeader}>
                <FontAwesome5
                  name="exclamation-circle"
                  size={16}
                  color={COLORS.warning}
                />
              </View>
              <Text style={styles.summaryValue}>
                ₹{pending.toLocaleString()}
              </Text>
              <Text style={styles.summaryLabel}>PENDING</Text>
              <View style={[styles.summaryStripe, { backgroundColor: COLORS.warning }]} />
            </View>
          </Animated.View>

          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Fee Cards */}
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>FEE STRUCTURE</Text>
            </View>
            {getOrderedMonths().map((month, index) =>
              renderFeeCard(month, index)
            )}

            <View style={styles.bottomSpace} />
          </ScrollView>

          {/* Payment Button */}
          {selectedMonths.length > 0 && (
            <Animated.View
              entering={FadeInUp.springify()}
              style={styles.paymentContainer}
            >
              <View style={styles.paymentSummary}>
                <Text style={styles.paymentText}>
                  {selectedMonths.length}{" "}
                  {selectedMonths.length === 1 ? "MONTH" : "MONTHS"} SELECTED
                </Text>
                <Text style={styles.paymentAmount}>
                  ₹
                  {selectedMonths
                    .reduce((sum, month) => {
                      const monthTotal =
                        typeof feeData[month].total === "number"
                          ? feeData[month].total
                          : parseFloat(feeData[month].total) || 0;
                      return sum + monthTotal;
                    }, 0)
                    .toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => {
                  router.push({
                    pathname: "/PaymentConfirmationScreen",
                    params: {
                      student_id: studentInfo.id,
                      student_name: studentInfo.name,
                      student_class: studentInfo.class,
                      student_section: studentInfo.section,
                      selectedMonths: JSON.stringify(selectedMonths),
                      totalAmount: selectedMonths.reduce((sum, month) => {
                        const monthTotal =
                          typeof feeData[month].total === "number"
                            ? feeData[month].total
                            : parseFloat(feeData[month].total) || 0;
                        return sum + monthTotal;
                      }, 0),
                    },
                  });
                }}
              >
                <LinearGradient
                  colors={[COLORS.success, COLORS.primary]}
                  style={styles.payButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.buttonStripe} />
                  <Text style={styles.payButtonText}>PAY NOW</Text>
                  <FontAwesome5
                    name="arrow-right"
                    size={16}
                    color={COLORS.white}
                    style={{ marginLeft: 8 }}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 100,
    overflow: "hidden",
  },
  headerGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 100,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
    letterSpacing: 2,
  },
  headerUnderline: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  loadingBadge: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  loadingBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.error + '20',
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.error,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  retryButton: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  retryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonStripe: {
    width: 3,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 2,
    marginRight: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1.2,
  },
  studentInfoCard: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  studentDetail: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  studentInfoRow: {
    marginTop: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '20',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  studentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.accent,
    position: "relative",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  avatarBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  summaryCardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  summaryCard: {
    width: (width - 56) / 3,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCardHeader: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
    zIndex: 1,
    letterSpacing: 0.5,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    zIndex: 1,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  summaryStripe: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.primary,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  feeCard: {
    marginBottom: 16,
  },
  feeCardContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  paidCard: {
    borderLeftColor: COLORS.success,
    opacity: 0.8,
  },
  selectedCard: {
    borderLeftColor: COLORS.warning,
    backgroundColor: '#FFF8E1',
    borderColor: COLORS.warning + '40',
  },
  feeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  monthTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  oneTimeBadge: {
    backgroundColor: COLORS.error + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
  },
  oneTimeLabel: {
    fontSize: 9,
    color: COLORS.error,
    fontWeight: "bold",
    letterSpacing: 0.8,
  },
  feeStatus: {
    alignItems: "flex-end",
  },
  paidStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.success + '40',
  },
  paidStatusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.success,
    letterSpacing: 0.8,
  },
  pendingStatusPill: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  pendingStatusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.warning,
    letterSpacing: 0.8,
  },
  selectedStatusPill: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  feeBreakdown: {
    marginTop: 12,
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  feeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
  },
  feeItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  feeLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  feeValue: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  paymentContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
  },
  paymentSummary: {
    flex: 1,
  },
  paymentText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  payButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginLeft: 16,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  payButtonGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1.2,
  },
  bottomSpace: {
    height: 100,
  },
});