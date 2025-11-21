import { FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  primary: '#2C3E23',        // Dark Military Green
  secondary: '#4A5D23',      // Olive Drab
  accent: '#C19A6B',         // Desert Sand/Tan
  white: '#FFFFFF',
  gray: '#6B6B6B',          // Gunmetal Gray
  lightGray: '#D4D2C8',     // Light Stone
  error: '#8B4513',         // Saddle Brown
  success: '#556B2F',       // Dark Olive Green
  background: '#E8E4DC',    // Light Khaki Background
  cardBg: '#F5F3EE',        // Card Background
  darkAccent: '#3E4A2D',    // Dark Forest Green
  combat: '#454B3D',        // Combat Gray-Green
  border: '#9A8F7F',        // Border Color
  warning: '#B8956A',       // Tan/Khaki
};

// Class and Section options
const CLASS_OPTIONS = [
  { label: "NUR", value: "NUR" },
  { label: "LKG", value: "LKG" },
  { label: "UKG", value: "UKG" },
  { label: "I", value: "I" },
  { label: "II", value: "II" },
  { label: "III", value: "III" },
  { label: "IV", value: "IV" },
  { label: "V", value: "V" },
  { label: "VI", value: "VI" },
  { label: "VII", value: "VII" },
  { label: "VIII", value: "VIII" },
  { label: "IX", value: "IX" },
  { label: "X", value: "X" },
];

const SECTION_OPTIONS = [
  { label: "Section A", value: "A" },
  { label: "Section B", value: "B" },
  { label: "Section C", value: "C" },
];

const MONTH_OPTIONS = [
  { label: "January", value: "January" },
  { label: "February", value: "February" },
  { label: "March", value: "March" },
  { label: "April", value: "April" },
  { label: "May", value: "May" },
  { label: "June", value: "June" },
  { label: "July", value: "July" },
  { label: "August", value: "August" },
  { label: "September", value: "September" },
  { label: "October", value: "October" },
  { label: "November", value: "November" },
  { label: "December", value: "December" },
];

export default function DuesListScreen() {
  const router = useRouter();

  // Selection states
  const [selectedClass, setSelectedClass] = useState("I");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedMonths, setSelectedMonths] = useState([
    "September",
    "October",
  ]);

  // Modal states
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showMonthsModal, setShowMonthsModal] = useState(false);

  // Data and loading states
  const [duesData, setDuesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Summary data
  const [summary, setSummary] = useState({
    totalStudents: 0,
    totalDues: 0,
    averageDue: 0,
  });

  // Toggle for filter section visibility
  const [showFilters, setShowFilters] = useState(false);

  // Effects
  useEffect(() => {
    if (selectedClass && selectedSection && selectedMonths.length > 0) {
      fetchDuesData();
    }
  }, [selectedClass, selectedSection, selectedMonths]);

  useEffect(() => {
    if (duesData.length > 0) {
      filterData();
      calculateSummary();
    }
  }, [duesData, searchQuery]);

  const fetchDuesData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "https://abma.org.in/binex/api.php?task=dues_list",
        {
          student_class: selectedClass,
          student_section: selectedSection,
          months: selectedMonths,
        }
      );

      if (Array.isArray(response.data)) {
        setDuesData(response.data);
        setFilteredData(response.data);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error fetching dues data:", err);
      setError("Failed to load dues data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filterData = () => {
    if (!searchQuery.trim()) {
      setFilteredData(duesData);
      return;
    }

    const filtered = duesData.filter(
      (student) =>
        student.student_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        student.student_admission.includes(searchQuery) ||
        student.student_mobile.includes(searchQuery)
    );

    setFilteredData(filtered);
  };

  const calculateSummary = () => {
    const totalStudents = duesData.length;
    let totalDues = 0;

    duesData.forEach((student) => {
      const previousDues = parseFloat(student.previous_dues) || 0;
      const currentFees = student.fee?.total || 0;
      totalDues += previousDues + currentFees;
    });

    const averageDue =
      totalStudents > 0 ? Math.round(totalDues / totalStudents) : 0;

    setSummary({
      totalStudents,
      totalDues,
      averageDue,
    });
  };

  const toggleMonthSelection = (month) => {
    if (selectedMonths.includes(month)) {
      if (selectedMonths.length > 1) {
        setSelectedMonths(selectedMonths.filter((m) => m !== month));
      }
    } else {
      setSelectedMonths([...selectedMonths, month]);
    }
  };

  const formatCurrency = (amount) => {
    return "₹" + parseFloat(amount).toLocaleString("en-IN");
  };

  const generatePDF = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 20px;
                background-color: #E8E4DC;
              }
              h1 {
                color: #2C3E23;
                text-align: center;
                font-size: 24px;
                letter-spacing: 2px;
                text-transform: uppercase;
              }
              .header-details {
                text-align: center;
                margin-bottom: 20px;
                font-size: 14px;
                color: #6B6B6B;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                background-color: white;
              }
              th {
                background-color: #2C3E23;
                color: #C19A6B;
                padding: 10px;
                text-align: left;
                font-size: 12px;
                letter-spacing: 1px;
              }
              td {
                padding: 10px;
                border-bottom: 1px solid #D4D2C8;
                font-size: 12px;
              }
              tr:nth-child(even) {
                background-color: #F5F3EE;
              }
              .summary {
                margin-top: 20px;
                padding: 15px;
                background-color: #F5F3EE;
                border-radius: 5px;
                border-left: 4px solid #C19A6B;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #6B6B6B;
              }
            </style>
          </head>
          <body>
            <h1>Dues List Report</h1>
            <div class="header-details">
              Class: ${selectedClass}-${selectedSection} | Months: ${selectedMonths.join(", ")}
              <br>Date: ${new Date().toLocaleDateString()}
            </div>
            
            <table>
              <tr>
                <th>STUDENT NAME</th>
                <th>ADMISSION NO.</th>
                <th>PREVIOUS DUES</th>
                <th>CURRENT FEES</th>
                <th>TOTAL DUE</th>
              </tr>
              ${filteredData
                .map(
                  (student) => `
                <tr>
                  <td>${student.student_name}</td>
                  <td>${student.student_admission}</td>
                  <td>${formatCurrency(student.previous_dues)}</td>
                  <td>${formatCurrency(student.fee.total)}</td>
                  <td>${formatCurrency(
                    parseFloat(student.previous_dues) + student.fee.total
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </table>
            
            <div class="summary">
              <strong>SUMMARY:</strong>
              <br>Total Students with Dues: ${summary.totalStudents}
              <br>Total Outstanding Amount: ${formatCurrency(summary.totalDues)}
              <br>Average Due per Student: ${formatCurrency(summary.averageDue)}
            </div>
            
            <div class="footer">
              ABMA - Dues Report Generated on ${new Date().toLocaleString()}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
          dialogTitle: "Share Dues List PDF Report",
        });
      } else {
        Alert.alert(
          "Sharing not available",
          "Sharing is not available on this device"
        );
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF report");
    }
  };

  const makePhoneCall = async (phoneNumber) => {
    const cleanedNumber = String(phoneNumber).trim();

    if (!cleanedNumber || !/^\+?\d{7,15}$/.test(cleanedNumber)) {
      Alert.alert("Invalid Number", "Please provide a valid phone number.");
      return;
    }

    const phoneUrl =
      Platform.OS === "android"
        ? `tel:${cleanedNumber}`
        : `telprompt:${cleanedNumber}`;

    try {
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert("Not Supported", "Your device cannot make this call.");
      }
    } catch (error) {
      console.error("Error making phone call:", error);
      Alert.alert("Error", "Something went wrong while trying to make the call.");
    }
  };

  const sendWhatsAppMessage = (phoneNumber, studentName, amount) => {
    if (!phoneNumber) return;

    const cleanedNumber = phoneNumber.replace(/\D/g, "");
    const formattedNumber =
      cleanedNumber.length === 10 ? `91${cleanedNumber}` : cleanedNumber;

    const message = `Dear Parent, This is to remind you that fee payment of ${formatCurrency(
      amount
    )} is pending for ${studentName}. Kindly pay at your earliest convenience. Thank you, ABMA`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        }
        Alert.alert("WhatsApp is not installed on this device");
      })
      .catch((err) => console.error("Error opening WhatsApp:", err));
  };

  const renderDuesItem = ({ item }) => {
    const previousDues = parseFloat(item.previous_dues) || 0;
    const currentFees = item.fee?.total || 0;
    const totalDue = previousDues + currentFees;

    return (
      <View style={styles.duesCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.studentName}>{item.student_name}</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>TOTAL DUE</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalDue)}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ADMISSION NO.</Text>
              <Text style={styles.detailValue}>{item.student_admission}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>MOBILE</Text>
              <Text style={styles.detailValue}>{item.student_mobile}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.feesSection}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Previous Dues</Text>
              <Text style={[styles.feeValue, styles.previousDue]}>
                {formatCurrency(previousDues)}
              </Text>
            </View>

            {item.fee?.tution_fee && (
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Tuition Fee</Text>
                <Text style={styles.feeValue}>
                  {formatCurrency(item.fee.tution_fee)}
                </Text>
              </View>
            )}

            {item.fee?.transport_fee && (
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Transport Fee</Text>
                <Text style={styles.feeValue}>
                  {formatCurrency(item.fee.transport_fee)}
                </Text>
              </View>
            )}

            <View style={[styles.feeRow, styles.currentFeeRow]}>
              <Text style={styles.currentFeeLabel}>Current Fee</Text>
              <Text style={styles.currentFeeValue}>
                {formatCurrency(currentFees)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => makePhoneCall(item.student_mobile)}
          >
            <FontAwesome5 name="phone-alt" size={14} color={COLORS.success} />
            <Text style={styles.callButtonText}>CALL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messageButton}
            onPress={() =>
              sendWhatsAppMessage(
                item.student_mobile,
                item.student_name,
                totalDue
              )
            }
          >
            <FontAwesome5 name="whatsapp" size={14} color={COLORS.success} />
            <Text style={styles.messageButtonText}>WHATSAPP</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() =>
              router.push({
                pathname: "/student-profile",
                params: { student_id: item.id },
              })
            }
          >
            <FontAwesome5 name="user" size={14} color={COLORS.primary} />
            <Text style={styles.viewButtonText}>PROFILE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary, COLORS.darkAccent]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <FontAwesome5 name="arrow-left" size={20} color={COLORS.accent} />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>DUES LIST</Text>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={generatePDF}
                >
                  <FontAwesome5 name="file-pdf" size={18} color={COLORS.accent} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Filter toggle */}
        <View style={styles.filterToggleContainer}>
          <View style={styles.selectedInfoContainer}>
            <Text style={styles.selectedInfoText}>
              CLASS {selectedClass}-{selectedSection} • {selectedMonths.length} MONTHS
            </Text>
          </View>

          <TouchableOpacity
            style={styles.filterToggleButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <FontAwesome5
              name={showFilters ? "chevron-up" : "chevron-down"}
              size={14}
              color={COLORS.gray}
            />
          </TouchableOpacity>
        </View>

        {/* Expandable Filters Section */}
        {showFilters && (
          <>
            {/* Selection Bar */}
            <View style={styles.selectionBar}>
              <View style={styles.selectionRow}>
                {/* Class Selector */}
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => setShowClassModal(true)}
                >
                  <Text style={styles.selectorLabel}>CLASS</Text>
                  <View style={styles.selectorValue}>
                    <Text style={styles.selectedValueText}>
                      {selectedClass}
                    </Text>
                    <FontAwesome5
                      name="chevron-down"
                      size={12}
                      color={COLORS.gray}
                    />
                  </View>
                </TouchableOpacity>

                {/* Section Selector */}
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => setShowSectionModal(true)}
                >
                  <Text style={styles.selectorLabel}>SECTION</Text>
                  <View style={styles.selectorValue}>
                    <Text style={styles.selectedValueText}>
                      {selectedSection}
                    </Text>
                    <FontAwesome5
                      name="chevron-down"
                      size={12}
                      color={COLORS.gray}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Month Selector */}
              <TouchableOpacity
                style={styles.monthSelector}
                onPress={() => setShowMonthsModal(true)}
              >
                <Text style={styles.monthSelectorLabel}>SELECTED MONTHS</Text>
                <View style={styles.selectedMonthsContainer}>
                  {selectedMonths.map((month) => (
                    <View key={month} style={styles.monthChip}>
                      <Text style={styles.monthChipText}>{month}</Text>
                    </View>
                  ))}
                  <FontAwesome5
                    name="edit"
                    size={12}
                    color={COLORS.gray}
                    style={styles.editIcon}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <View style={styles.summaryIconContainer}>
                  <FontAwesome5 name="users" size={20} color={COLORS.accent} />
                </View>
                <Text style={styles.summaryValue}>{summary.totalStudents}</Text>
                <Text style={styles.summaryLabel}>STUDENTS</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryIconContainer}>
                  <FontAwesome5 name="rupee-sign" size={20} color={COLORS.accent} />
                </View>
                <Text style={styles.summaryValue}>
                  {formatCurrency(summary.totalDues)}
                </Text>
                <Text style={styles.summaryLabel}>TOTAL DUES</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryIconContainer}>
                  <FontAwesome5 name="chart-line" size={20} color={COLORS.accent} />
                </View>
                <Text style={styles.summaryValue}>
                  {formatCurrency(summary.averageDue)}
                </Text>
                <Text style={styles.summaryLabel}>AVG. DUE</Text>
              </View>
            </View>
          </>
        )}

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={16} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or admission number..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesome5 name="times" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Dues List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>LOADING DUES DATA...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <FontAwesome5 name="exclamation-circle" size={50} color={COLORS.error} />
            <Text style={styles.errorTitle}>ERROR LOADING DATA</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchDuesData}
            >
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        ) : filteredData.length > 0 ? (
          <FlatList
            data={filteredData}
            renderItem={renderDuesItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={true}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome5
              name="file-invoice-dollar"
              size={50}
              color={COLORS.lightGray}
            />
            <Text style={styles.emptyTitle}>NO DUES FOUND</Text>
            <Text style={styles.emptyText}>
              No students with outstanding dues for the selected criteria
            </Text>
          </View>
        )}

        {/* Class Selection Modal */}
        <Modal
          visible={showClassModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowClassModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>SELECT CLASS</Text>
                <TouchableOpacity onPress={() => setShowClassModal(false)}>
                  <FontAwesome5 name="times" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                {CLASS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalOption,
                      selectedClass === option.value &&
                        styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedClass(option.value);
                      setShowClassModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedClass === option.value &&
                          styles.modalOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selectedClass === option.value && (
                      <FontAwesome5 name="check" size={16} color={COLORS.success} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Section Selection Modal */}
        <Modal
          visible={showSectionModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSectionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>SELECT SECTION</Text>
                <TouchableOpacity onPress={() => setShowSectionModal(false)}>
                  <FontAwesome5 name="times" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                {SECTION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalOption,
                      selectedSection === option.value &&
                        styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedSection(option.value);
                      setShowSectionModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedSection === option.value &&
                          styles.modalOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selectedSection === option.value && (
                      <FontAwesome5 name="check" size={16} color={COLORS.success} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Month Selection Modal */}
        <Modal
          visible={showMonthsModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMonthsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>SELECT MONTHS</Text>
                <TouchableOpacity onPress={() => setShowMonthsModal(false)}>
                  <FontAwesome5 name="times" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                {MONTH_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalOption,
                      selectedMonths.includes(option.value) &&
                        styles.modalOptionSelected,
                    ]}
                    onPress={() => toggleMonthSelection(option.value)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedMonths.includes(option.value) &&
                          styles.modalOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {selectedMonths.includes(option.value) && (
                      <FontAwesome5 name="check" size={16} color={COLORS.success} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalDoneButton}
                  onPress={() => setShowMonthsModal(false)}
                >
                  <Text style={styles.modalDoneText}>DONE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 65,
    width: "100%",
  },
  headerGradient: {
    flex: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(193, 154, 107, 0.15)',
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.accent,
    letterSpacing: 1.5,
  },
  actionButtons: {
    flexDirection: "row",
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(193, 154, 107, 0.15)',
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  // Filter toggle styles
  filterToggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '60',
  },
  selectedInfoContainer: {
    flex: 1,
  },
  selectedInfoText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  filterToggleButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  // Selection styles
  selectionBar: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '60',
  },
  selectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  selector: {
    flex: 1,
    marginHorizontal: 4,
  },
  selectorLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  selectorValue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  selectedValueText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  monthSelector: {
    marginTop: 4,
  },
  monthSelectorLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  selectedMonthsContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  monthChip: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  monthChipText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  editIcon: {
    marginLeft: "auto",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    margin: 16,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 16,
    margin: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '700',
    letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
  },
  retryText: {
    color: COLORS.accent,
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  duesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border + '30',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '60',
    backgroundColor: COLORS.cardBg,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginBottom: 2,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.error,
  },
  cardDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 2,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray + '60',
    marginVertical: 12,
  },
  feesSection: {
    marginTop: 4,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  feeValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  previousDue: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  currentFeeRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray + '60',
  },
  currentFeeLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  currentFeeValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  cardFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray + '60',
  },
  callButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: COLORS.lightGray + '60',
  },
  callButtonText: {
    fontSize: 12,
    color: COLORS.success,
    marginLeft: 6,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: COLORS.lightGray + '60',
  },
  messageButtonText: {
    fontSize: 12,
    color: COLORS.success,
    marginLeft: 6,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  viewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  viewButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(44, 62, 35, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: COLORS.white,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent + '30',
    backgroundColor: COLORS.cardBg,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
    letterSpacing: 1.2,
  },
  modalContent: {
    maxHeight: "80%",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '60',
  },
  modalOptionSelected: {
    backgroundColor: COLORS.cardBg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  modalOptionText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  modalFooter: {
    borderTopWidth: 2,
    borderTopColor: COLORS.accent + '30',
    padding: 12,
    alignItems: "flex-end",
    backgroundColor: COLORS.cardBg,
  },
  modalDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    elevation: 2,
  },
  modalDoneText: {
    color: COLORS.accent,
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 1,
  },
});