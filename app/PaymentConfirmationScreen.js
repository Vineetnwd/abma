import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

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
  inputBg: '#FFFFFF',        // White
};

const paymentModes = [
  { id: 'cash', label: 'Cash', icon: 'money-bill-wave' },
  { id: 'online', label: 'Online Transfer', icon: 'university' },
  { id: 'upi', label: 'UPI', icon: 'mobile-alt' },
  { id: 'cheque', label: 'Cheque', icon: 'money-check' },
  { id: 'card', label: 'Debit/Credit Card', icon: 'credit-card' },
];

export default function PaymentConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const studentId = params.student_id;
  const studentName = params.student_name;
  const studentClass = params.student_class;
  const studentSection = params.student_section;
  const selectedMonths = params.selectedMonths ? JSON.parse(params.selectedMonths) : [];
  const totalAmount = params.totalAmount ? parseFloat(params.totalAmount) : 0;
  
  const [formData, setFormData] = useState({
    discount: 0,
    miscFee: 0,
    paidAmount: totalAmount,
    paymentMode: 'cash',
    paymentDate: new Date(),
    remarks: '',
  });
  
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isPaymentModeModalVisible, setPaymentModeModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [netAmount, setNetAmount] = useState(totalAmount);
  
  useEffect(() => {
    const discount = parseFloat(formData.discount) || 0;
    const miscFee = parseFloat(formData.miscFee) || 0;
    const calculated = totalAmount - discount + miscFee;
    const netTotal = calculated > 0 ? calculated : 0;
    
    setNetAmount(netTotal);
    
    if (parseFloat(formData.paidAmount) > netTotal) {
      setFormData(prev => ({
        ...prev,
        paidAmount: netTotal
      }));
    }
  }, [formData.discount, formData.miscFee, totalAmount]);
  
  const handleInputChange = (field, value) => {
    if (field === 'paidAmount') {
      const numValue = parseFloat(value) || 0;
      if (numValue > netAmount) {
        value = netAmount.toString();
      }
    }
    
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };
  
  const handleDateChange = (event, selectedDate) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        paymentDate: selectedDate
      });
    }
  };
  
  const togglePaymentModeModal = () => {
    setPaymentModeModalVisible(!isPaymentModeModalVisible);
  };
  
  const selectPaymentMode = (mode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData({
      ...formData,
      paymentMode: mode
    });
    setPaymentModeModalVisible(false);
  };
  
  const getSelectedPaymentMode = () => {
    return paymentModes.find(mode => mode.id === formData.paymentMode) || paymentModes[0];
  };
  
  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const paidAmount = parseFloat(formData.paidAmount) || 0;
    
    if (netAmount <= 0) {
      Alert.alert("Invalid Amount", "Payment amount must be greater than zero.");
      return;
    }
    
    if (paidAmount <= 0) {
      Alert.alert("Invalid Payment", "Paid amount must be greater than zero.");
      return;
    }
    
    Alert.alert(
      "Confirm Payment",
      `Process payment of ₹${paidAmount.toLocaleString()} for ${studentName}?` +
      (paidAmount < netAmount ? `\n\nThis is a partial payment (Total due: ₹${netAmount.toLocaleString()})` : ""),
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm",
          onPress: processPayment
        }
      ]
    );
  };
  
 
  
const processPayment = async () => {
  let user_id = await AsyncStorage.getItem("user_id");
  setIsSubmitting(true);

  try {
    const formattedDate = formData.paymentDate.toISOString().split("T")[0];
    const paidAmount = parseFloat(formData.paidAmount) || 0;

    const formDataToSend = new FormData();

    formDataToSend.append("student_id", studentId);
    formDataToSend.append("discount", formData.discount);
    formDataToSend.append("misc_fee", formData.miscFee);
    formDataToSend.append("payment_mode", formData.paymentMode);
    formDataToSend.append("payment_date", formattedDate);
    formDataToSend.append("remarks", formData.remarks);
    formDataToSend.append("total", netAmount.toString());
    formDataToSend.append("paid_amount", paidAmount.toString());
    formDataToSend.append("created_by", user_id || "1");

    // months[]
    selectedMonths.forEach((m) => {
      formDataToSend.append("months[]", m);
    });

    // fee_list[][]
    selectedMonths.forEach((month, index) => {
      const monthTotal =
        typeof totalAmount === "number"
          ? totalAmount
          : parseFloat(totalAmount);

      formDataToSend.append(`fee_list[${index}][month]`, month);
      formDataToSend.append(`fee_list[${index}][fee_type]`, "tuition_fee");
      formDataToSend.append(`fee_list[${index}][amount]`, monthTotal.toString());
    });

    const response = await axios.post(
      "https://abma.org.in/binex/api.php?task=pay_fee",
      formDataToSend,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setIsSubmitting(false);

    if (response.data.status === "success") {
      Alert.alert(
        "Payment Successful",
        `Receipt Number: ${response.data.id}\nAmount Paid: ₹${paidAmount.toLocaleString()}`,
        [
          {
            text: "View Receipt",
            onPress: () =>
              router.push({
                pathname: "/ReceiptScreen",
                params: { receipt_no: response.data.id },
              }),
          },
          { text: "Done", onPress: () => router.push("/dashboard") },
        ]
      );
    } else {
      throw new Error(response.data.msg || "Payment failed. Please try again.");
    }
  } catch (error) {
    setIsSubmitting(false);

    Alert.alert(
      "Payment Failed",
      error.message || "An error occurred while processing your payment.",
      [{ text: "OK" }]
    );
  }
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
            <Text style={styles.headerTitle}>PAYMENT</Text>
            <View style={styles.headerUnderline} />
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Student Info Card */}
          <Animated.View
            entering={FadeInUp.delay(100).springify()}
            style={styles.studentInfoCard}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.studentAvatar}
            >
              <Text style={styles.avatarText}>{studentName.charAt(0)}</Text>
              <View style={styles.avatarBadge}>
                <View style={styles.avatarDot} />
              </View>
            </LinearGradient>
            <View style={styles.studentDetail}>
              <Text style={styles.studentName}>{studentName}</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <FontAwesome5 name="graduation-cap" size={10} color={COLORS.primary} />
                </View>
                <Text style={styles.infoText}>CLASS {studentClass}-{studentSection}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <FontAwesome5 name="id-badge" size={10} color={COLORS.primary} />
                </View>
                <Text style={styles.infoText}>ID: {studentId}</Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Payment Details */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.card}
          >
            <View style={styles.cardTitleContainer}>
              <View style={styles.cardDot} />
              <Text style={styles.cardTitle}>PAYMENT DETAILS</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Selected Months</Text>
              <View style={styles.detailBadge}>
                <Text style={styles.detailValue}>{selectedMonths.length} months</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={styles.detailValue}>₹{totalAmount.toLocaleString()}</Text>
            </View>
            
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <View style={styles.labelDot} />
                <Text style={styles.inputLabel}>DISCOUNT (₹)</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={formData.discount.toString()}
                onChangeText={(value) => handleInputChange('discount', value)}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <View style={styles.labelDot} />
                <Text style={styles.inputLabel}>MISCELLANEOUS FEE (₹)</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={formData.miscFee.toString()}
                onChangeText={(value) => handleInputChange('miscFee', value)}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            
            <View style={styles.netAmountContainer}>
              <View style={styles.netAmountStripe} />
              <View style={styles.netAmountContent}>
                <Text style={styles.netAmountLabel}>NET AMOUNT</Text>
                <Text style={styles.netAmount}>₹{netAmount.toLocaleString()}</Text>
              </View>
            </View>
            
            <View style={[styles.inputContainer, { marginTop: 16 }]}>
              <View style={styles.labelContainer}>
                <View style={styles.labelDot} />
                <Text style={styles.inputLabel}>AMOUNT PAYING NOW (₹)</Text>
              </View>
              <View style={styles.paidAmountContainer}>
                <TextInput
                  style={styles.textInput}
                  value={formData.paidAmount.toString()}
                  onChangeText={(value) => handleInputChange('paidAmount', value)}
                  keyboardType="numeric"
                  placeholder={netAmount.toString()}
                  placeholderTextColor={COLORS.textSecondary}
                />
                <TouchableOpacity
                  style={styles.payFullButton}
                  onPress={() => handleInputChange('paidAmount', netAmount.toString())}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.secondary]}
                    style={styles.payFullButtonGradient}
                  >
                    <View style={styles.buttonStripe} />
                    <Text style={styles.payFullButtonText}>PAY FULL</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              
              {parseFloat(formData.paidAmount) < netAmount && (
                <View style={styles.partialPaymentNote}>
                  <View style={styles.partialIconContainer}>
                    <FontAwesome5 name="info-circle" size={14} color={COLORS.warning} />
                  </View>
                  <View style={styles.partialTextContainer}>
                    <Text style={styles.partialPaymentTitle}>PARTIAL PAYMENT</Text>
                    <Text style={styles.partialPaymentText}>
                      Remaining: ₹{(netAmount - parseFloat(formData.paidAmount)).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
          
          {/* Payment Options */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.card}
          >
            <View style={styles.cardTitleContainer}>
              <View style={styles.cardDot} />
              <Text style={styles.cardTitle}>PAYMENT OPTIONS</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.selectContainer}
              onPress={togglePaymentModeModal}
            >
              <View style={styles.labelContainer}>
                <View style={styles.labelDot} />
                <Text style={styles.inputLabel}>PAYMENT MODE</Text>
              </View>
              <View style={styles.selectedOption}>
                <View style={styles.optionIconContainer}>
                  <FontAwesome5 
                    name={getSelectedPaymentMode().icon} 
                    size={16} 
                    color={COLORS.primary} 
                  />
                </View>
                <Text style={styles.selectedOptionText}>{getSelectedPaymentMode().label}</Text>
                <FontAwesome5 name="chevron-down" size={14} color={COLORS.textSecondary} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.selectContainer}
              onPress={showDatePicker}
            >
              <View style={styles.labelContainer}>
                <View style={styles.labelDot} />
                <Text style={styles.inputLabel}>PAYMENT DATE</Text>
              </View>
              <View style={styles.selectedOption}>
                <View style={styles.optionIconContainer}>
                  <FontAwesome5 name="calendar-alt" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.selectedOptionText}>
                  {formData.paymentDate.toLocaleDateString()}
                </Text>
                <FontAwesome5 name="chevron-down" size={14} color={COLORS.textSecondary} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <View style={styles.labelDot} />
                <Text style={styles.inputLabel}>REMARKS (OPTIONAL)</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.remarks}
                onChangeText={(value) => handleInputChange('remarks', value)}
                placeholder="Add any additional notes here..."
                placeholderTextColor={COLORS.textSecondary}
                multiline={true}
                numberOfLines={3}
              />
            </View>
          </Animated.View>
          
          {/* Months Detail */}
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={styles.card}
          >
            <View style={styles.cardTitleContainer}>
              <View style={styles.cardDot} />
              <Text style={styles.cardTitle}>SELECTED MONTHS</Text>
            </View>
            
            <View style={styles.monthsList}>
              {selectedMonths.map((month, index) => (
                <View key={month} style={styles.monthItem}>
                  <View style={styles.monthIconContainer}>
                    <FontAwesome5 name="calendar-check" size={14} color={COLORS.primary} />
                  </View>
                  <Text style={styles.monthText}>
                    {month === "Admission_month" ? "ADMISSION FEES" : month.toUpperCase()}
                  </Text>
                  <View style={styles.monthDot} />
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Payment Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.payButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={[COLORS.success, COLORS.primary]}
            style={styles.payButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.white} />
                <Text style={styles.loadingText}>PROCESSING...</Text>
              </View>
            ) : (
              <>
                <View style={styles.buttonStripe} />
                <Text style={styles.payButtonText}>
                  PAY ₹{parseFloat(formData.paidAmount).toLocaleString()}
                </Text>
                <FontAwesome5 name="check-circle" size={16} color={COLORS.white} style={{ marginLeft: 8 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Date Picker Modal */}
      {isDatePickerVisible && (
        <DateTimePicker
          value={formData.paymentDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
      
      {/* Payment Mode Modal */}
      <Modal
        visible={isPaymentModeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={togglePaymentModeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={togglePaymentModeModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <View style={styles.modalDot} />
                  <Text style={styles.modalTitle}>SELECT PAYMENT MODE</Text>
                </View>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={togglePaymentModeModal}
                >
                  <FontAwesome5 name="times" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.paymentModeList}>
                {paymentModes.map(mode => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.paymentModeItem,
                      formData.paymentMode === mode.id && styles.selectedPaymentMode
                    ]}
                    onPress={() => selectPaymentMode(mode.id)}
                  >
                    {formData.paymentMode === mode.id && <View style={styles.modeStripe} />}
                    <View style={[
                      styles.modeIconContainer,
                      formData.paymentMode === mode.id && styles.selectedModeIconContainer
                    ]}>
                      <FontAwesome5 
                        name={mode.icon} 
                        size={20} 
                        color={formData.paymentMode === mode.id ? COLORS.white : COLORS.primary} 
                      />
                    </View>
                    <Text style={[
                      styles.paymentModeText,
                      formData.paymentMode === mode.id && styles.selectedPaymentModeText
                    ]}>
                      {mode.label}
                    </Text>
                    {formData.paymentMode === mode.id && (
                      <View style={styles.checkBadge}>
                        <FontAwesome5 name="check" size={12} color={COLORS.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 100,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  headerUnderline: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  placeholder: {
    width: 40,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  studentInfoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  studentAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: COLORS.accent,
    position: 'relative',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  avatarBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  studentDetail: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  detailBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  inputContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  inputLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  textInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: COLORS.border,
    flex: 1,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  netAmountContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '15',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    position: 'relative',
  },
  netAmountStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  netAmountContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netAmountLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  netAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  paidAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payFullButton: {
    borderRadius: 8,
    overflow: 'hidden',
    marginLeft: 10,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  payFullButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buttonStripe: {
    width: 3,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
    marginRight: 6,
  },
  payFullButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  partialPaymentNote: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '15',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 2,
    borderColor: COLORS.warning + '40',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  partialIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.warning + '25',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.warning + '50',
  },
  partialTextContainer: {
    flex: 1,
  },
  partialPaymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginBottom: 2,
    letterSpacing: 0.8,
  },
  partialPaymentText: {
    fontSize: 13,
    color: COLORS.warning,
    fontWeight: '600',
  },
  selectContainer: {
    marginBottom: 16,
  },
  selectedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  optionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  selectedOptionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  monthsList: {
    marginTop: 4,
  },
  monthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  monthIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  monthText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  monthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  payButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 62, 31, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  paymentModeList: {
    marginBottom: 20,
  },
  paymentModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: COLORS.inputBg,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  selectedPaymentMode: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.dark,
  },
  modeStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  modeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  selectedModeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  paymentModeText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  selectedPaymentModeText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});