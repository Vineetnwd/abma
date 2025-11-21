import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Army Combat Theme Colors
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
  overlay: 'rgba(44, 62, 35, 0.95)',
};

export default function CollectionReportScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [toDate, setToDate] = useState(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  
  const [summaryData, setSummaryData] = useState({
    totalAmount: 0,
    totalReceipts: 0,
    avgAmount: 0
  });
  
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  useEffect(() => {
    fetchReports();
  }, [fromDate, toDate]);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter(report => 
        report.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.admission_no.includes(searchQuery) ||
        report.receipt_id.includes(searchQuery)
      );
      setFilteredReports(filtered);
    }
  }, [searchQuery, reports]);
  
  useEffect(() => {
    if (reports.length > 0) {
      calculateSummary();
    }
  }, [reports]);
  
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const formattedFromDate = fromDate.toISOString().split('T')[0];
      const formattedToDate = toDate.toISOString().split('T')[0];
      
      const response = await axios.post(
        'https://abma.org.in/binex/api.php?task=collection_report',
        {
          from_date: formattedFromDate,
          to_date: formattedToDate
        }
      );
      
      if (response.data.status === 'success') {
        const processedData = response.data.data.map(item => ({
          ...item,
          paid_amount: item.paid_amount !== null ? 
                       parseFloat(item.paid_amount) : 
                       null
        }));
        
        setReports(processedData);
        setFilteredReports(processedData);
      } else {
        Alert.alert('Error', 'Failed to load reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      Alert.alert('Error', 'An error occurred while fetching reports');
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateSummary = () => {
    const totalAmount = reports.reduce((sum, report) => {
      return sum + (report.paid_amount || 0);
    }, 0);
    
    const validReceipts = reports.filter(report => report.paid_amount !== null).length;
    const avgAmount = validReceipts > 0 ? totalAmount / validReceipts : 0;
    
    setSummaryData({
      totalAmount,
      totalReceipts: reports.length,
      avgAmount
    });
  };
  
  const handleFromDateChange = (event, selectedDate) => {
    setShowFromDatePicker(false);
    if (selectedDate) {
      setFromDate(selectedDate);
    }
  };
  
  const handleToDateChange = (event, selectedDate) => {
    setShowToDatePicker(false);
    if (selectedDate) {
      setToDate(selectedDate);
    }
  };
  
  const handleReceiptPress = (receipt) => {
    setSelectedReceipt(receipt);
    setShowReceiptModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const viewFullReceipt = () => {
    setShowReceiptModal(false);
    router.push({
      pathname: '/ReceiptScreen',
      params: {
        receipt_id: selectedReceipt.receipt_id
      }
    });
  };
  
  const renderReceiptItem = ({ item, index }) => {
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50).springify()}
        style={styles.receiptItem}
      >
        <TouchableOpacity 
          style={styles.receiptCard}
          onPress={() => handleReceiptPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.receiptHeader}>
            <View style={styles.receiptInfo}>
              <Text style={styles.receiptId}>#{item.receipt_id}</Text>
              <Text style={styles.receiptDate}>{item.paid_date}</Text>
            </View>
            <View style={styles.receiptAmount}>
              <Text style={styles.amountLabel}>AMOUNT</Text>
              <Text style={styles.amountValue}>
                {item.paid_amount !== null ? `₹${item.paid_amount.toLocaleString()}` : 'N/A'}
              </Text>
            </View>
          </View>
          
          <View style={styles.studentInfo}>
            <View style={styles.nameContainer}>
              <FontAwesome5 name="user-graduate" size={14} color={COLORS.accent} style={styles.nameIcon} />
              <Text style={styles.studentName}>{item.student_name}</Text>
            </View>
            <View style={styles.admissionContainer}>
              <FontAwesome5 name="id-card" size={14} color={COLORS.accent} style={styles.admissionIcon} />
              <Text style={styles.admissionNo}>{item.admission_no}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary, COLORS.darkAccent]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome5 name="arrow-left" size={20} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>COLLECTION REPORT</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchReports}
          >
            <FontAwesome5 name="sync-alt" size={20} color={COLORS.accent} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Animated.View 
        entering={FadeInDown.delay(100).springify()}
        style={styles.dateRangeContainer}
      >
        <View style={styles.datePickerRow}>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowFromDatePicker(true)}
          >
            <Text style={styles.datePickerLabel}>FROM DATE</Text>
            <View style={styles.dateDisplay}>
              <FontAwesome5 name="calendar-alt" size={14} color={COLORS.primary} style={styles.calendarIcon} />
              <Text style={styles.dateText}>
                {fromDate.toISOString().split('T')[0]}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowToDatePicker(true)}
          >
            <Text style={styles.datePickerLabel}>TO DATE</Text>
            <View style={styles.dateDisplay}>
              <FontAwesome5 name="calendar-alt" size={14} color={COLORS.primary} style={styles.calendarIcon} />
              <Text style={styles.dateText}>
                {toDate.toISOString().split('T')[0]}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      <Animated.View 
        entering={FadeInRight.delay(200).springify()}
        style={styles.summaryContainer}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <FontAwesome5 name="rupee-sign" size={20} color={COLORS.accent} />
          </View>
          <Text style={styles.summaryTitle}>TOTAL COLLECTION</Text>
          <Text style={styles.summaryValue}>₹{summaryData.totalAmount.toLocaleString()}</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <FontAwesome5 name="receipt" size={20} color={COLORS.accent} />
          </View>
          <Text style={styles.summaryTitle}>TOTAL RECEIPTS</Text>
          <Text style={styles.summaryValue}>{summaryData.totalReceipts}</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconContainer}>
            <FontAwesome5 name="chart-line" size={20} color={COLORS.accent} />
          </View>
          <Text style={styles.summaryTitle}>AVG. AMOUNT</Text>
          <Text style={styles.summaryValue}>₹{summaryData.avgAmount.toFixed(0)}</Text>
        </View>
      </Animated.View>
      
      <View style={styles.searchContainer}>
        <FontAwesome5 name="search" size={16} color={COLORS.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or admission number"
          placeholderTextColor={COLORS.gray}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <FontAwesome5 name="times-circle" size={16} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>LOADING REPORTS...</Text>
        </View>
      ) : filteredReports.length > 0 ? (
        <FlatList
          data={filteredReports}
          renderItem={renderReceiptItem}
          keyExtractor={item => item.receipt_id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="file-invoice-dollar" size={60} color={COLORS.lightGray} />
          <Text style={styles.emptyTitle}>NO REPORTS FOUND</Text>
          <Text style={styles.emptyText}>Try changing the date range or search criteria</Text>
        </View>
      )}
      
      {showFromDatePicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display="default"
          onChange={handleFromDateChange}
          maximumDate={toDate}
        />
      )}
      
      {showToDatePicker && (
        <DateTimePicker
          value={toDate}
          mode="date"
          display="default"
          onChange={handleToDateChange}
          minimumDate={fromDate}
          maximumDate={new Date()}
        />
      )}
      
      {/* Receipt Details Modal */}
      <Modal
        visible={showReceiptModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReceiptModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReceiptModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>RECEIPT DETAILS</Text>
                <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                  <FontAwesome5 name="times" size={20} color={COLORS.gray} />
                </TouchableOpacity>
              </View>
              
              {selectedReceipt && (
                <View style={styles.receiptDetails}>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Receipt Number</Text>
                    <Text style={styles.receiptDetailValue}>#{selectedReceipt.receipt_id}</Text>
                  </View>
                  
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Student Name</Text>
                    <Text style={styles.receiptDetailValue}>{selectedReceipt.student_name}</Text>
                  </View>
                  
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Admission No.</Text>
                    <Text style={styles.receiptDetailValue}>{selectedReceipt.admission_no}</Text>
                  </View>
                  
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Payment Date</Text>
                    <Text style={styles.receiptDetailValue}>{selectedReceipt.paid_date}</Text>
                  </View>
                  
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptDetailLabel}>Amount Paid</Text>
                    <Text style={styles.receiptDetailValue}>
                      {selectedReceipt.paid_amount !== null 
                        ? `₹${selectedReceipt.paid_amount.toLocaleString()}` 
                        : 'N/A'}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.viewFullButton}
                    onPress={viewFullReceipt}
                  >
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.secondary]}
                      style={styles.viewFullGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.viewFullText}>VIEW FULL RECEIPT</Text>
                      <FontAwesome5 name="external-link-alt" size={14} color={COLORS.accent} style={{ marginLeft: 8 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
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
    height: 120,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 120,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(193, 154, 107, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(193, 154, 107, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  dateRangeContainer: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: -40,
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  datePickerLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 6,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border + '60',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  calendarIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  summaryCard: {
    width: (width - 48) / 3,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    position: 'relative',
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
  summaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.gray,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  receiptItem: {
    marginBottom: 16,
  },
  receiptCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '60',
    paddingBottom: 12,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  receiptDate: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
  },
  receiptAmount: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 2,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  studentInfo: {
    marginBottom: 0,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameIcon: {
    marginRight: 10,
  },
  studentName: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  admissionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  admissionIcon: {
    marginRight: 10,
  },
  admissionNo: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent + '40',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  receiptDetails: {
    marginBottom: 20,
  },
  receiptDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '50',
  },
  receiptDetailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  receiptDetailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  viewFullButton: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  viewFullGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  viewFullText: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});