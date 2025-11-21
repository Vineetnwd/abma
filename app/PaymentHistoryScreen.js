import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

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
  paid: '#5D7C2F',          // Military green
  pending: '#C87533',       // Burnt orange
  overdue: '#8B4513',       // Saddle brown
};

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPayments: 0,
    currentDues: 0,
  });
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [payments]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError('');

      const studentId = await AsyncStorage.getItem('student_id');
      
      if (!studentId) {
        router.replace('/index');
        return;
      }

      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=payment_history',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ student_id: studentId }),
        }
      );

      const result = await response.json();
      
      if (result.status === 'success' && result.data && Array.isArray(result.data)) {
        const sortedPayments = result.data.sort((a, b) => 
          new Date(b.paid_date) - new Date(a.paid_date)
        );
        setPayments(sortedPayments);
        
        await AsyncStorage.setItem('cached_payments', JSON.stringify(sortedPayments));
      } else {
        setError('No payment history found');
        setPayments([]);
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError('Failed to load payment history');
      
      try {
        const cachedPayments = await AsyncStorage.getItem('cached_payments');
        if (cachedPayments) {
          setPayments(JSON.parse(cachedPayments));
          setError('Showing cached data. Network error occurred.');
        }
      } catch (cacheErr) {
        console.error('Cache error:', cacheErr);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentHistory();
  };

  const calculateStats = () => {
    const totalPaid = payments.reduce((sum, payment) => 
      sum + parseFloat(payment.paid_amount || 0), 0
    );
    
    const currentDues = payments.reduce((sum, payment) => 
      sum + parseFloat(payment.current_dues || 0), 0
    );

    setStats({
      totalPaid: totalPaid,
      totalPayments: payments.length,
      currentDues: currentDues,
    });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return COLORS.paid;
      case 'PENDING':
        return COLORS.pending;
      case 'OVERDUE':
        return COLORS.overdue;
      default:
        return COLORS.gray;
    }
  };

  const getFilteredPayments = () => {
    if (selectedFilter === 'all') {
      return payments;
    }
    return payments.filter(p => p.status?.toLowerCase() === selectedFilter);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="receipt" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.loadingText}>LOADING PAYMENT HISTORY...</Text>
        <View style={styles.loadingBadge}>
          <Text style={styles.loadingBadgeText}>TACTICAL LOADING</Text>
        </View>
      </View>
    );
  }

  const filteredPayments = getFilteredPayments();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.dark, COLORS.primary, COLORS.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>PAYMENT HISTORY</Text>
            <View style={styles.headerUnderline} />
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="wallet" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.statValue}>{formatCurrency(stats.totalPaid)}</Text>
            <Text style={styles.statLabel}>TOTAL PAID</Text>
            <View style={styles.statStripe} />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="receipt" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.statValue}>{stats.totalPayments}</Text>
            <Text style={styles.statLabel}>PAYMENTS</Text>
            <View style={styles.statStripe} />
          </View>
        </View>

        {/* Dues Card */}
        {stats.currentDues > 0 && (
          <View style={styles.duesCard}>
            <View style={styles.duesStripe} />
            <View style={styles.duesIcon}>
              <Ionicons name="alert-circle" size={24} color={COLORS.accent} />
            </View>
            <View style={styles.duesContent}>
              <Text style={styles.duesLabel}>CURRENT DUES</Text>
              <Text style={styles.duesAmount}>{formatCurrency(stats.currentDues)}</Text>
            </View>
            <View style={styles.duesBadge}>
              <View style={styles.duesDot} />
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterButton
          title="ALL"
          active={selectedFilter === 'all'}
          onPress={() => setSelectedFilter('all')}
          count={payments.length}
        />
        <FilterButton
          title="PAID"
          active={selectedFilter === 'paid'}
          onPress={() => setSelectedFilter('paid')}
          count={payments.filter(p => p.status?.toLowerCase() === 'paid').length}
        />
        <FilterButton
          title="PENDING"
          active={selectedFilter === 'pending'}
          onPress={() => setSelectedFilter('pending')}
          count={payments.filter(p => p.status?.toLowerCase() === 'pending').length}
        />
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="information-circle" size={18} color={COLORS.warning} />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Payment List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.secondary]}
            tintColor={COLORS.secondary}
          />
        }
      >
        {filteredPayments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="receipt-outline" size={80} color={COLORS.lightGray} />
            </View>
            <Text style={styles.emptyText}>
              {selectedFilter === 'all' 
                ? 'NO PAYMENT HISTORY' 
                : `NO ${selectedFilter.toUpperCase()} PAYMENTS`}
            </Text>
            <Text style={styles.emptySubText}>
              {selectedFilter === 'all' ? 'No transactions found' : 'Try a different filter'}
            </Text>
          </View>
        ) : (
          filteredPayments.map((payment, index) => (
            <PaymentCard
              key={payment.receipt_id}
              payment={payment}
              index={index}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusColor={getStatusColor}
            />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function FilterButton({ title, active, onPress, count }) {
  return (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
    >
      {active && <View style={styles.filterStripe} />}
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
        {title}
      </Text>
      {count > 0 && (
        <View style={[styles.countBadge, active && styles.countBadgeActive]}>
          <Text style={[styles.countText, active && styles.countTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function PaymentCard({ 
  payment, 
  index, 
  formatCurrency, 
  formatDate, 
  getStatusColor
}) {
  const [expanded, setExpanded] = useState(false);

  const getFeeBreakdown = () => {
    const fees = [];
    
    if (parseFloat(payment.admission_fee || 0) > 0) {
      fees.push({ label: 'Admission Fee', amount: payment.admission_fee });
    }
    if (parseFloat(payment.tution_fee || 0) > 0) {
      fees.push({ label: 'Tuition Fee', amount: payment.tution_fee });
    }
    if (parseFloat(payment.development_fee || 0) > 0) {
      fees.push({ label: 'Development Fee', amount: payment.development_fee });
    }
    if (parseFloat(payment.annual_fee || 0) > 0) {
      fees.push({ label: 'Annual Fee', amount: payment.annual_fee });
    }
    if (parseFloat(payment.registration_fee || 0) > 0) {
      fees.push({ label: 'Registration Fee', amount: payment.registration_fee });
    }
    if (parseFloat(payment.hostel_fee || 0) > 0) {
      fees.push({ label: 'Hostel Fee', amount: payment.hostel_fee });
    }
    if (parseFloat(payment.transport_fee || 0) > 0) {
      fees.push({ label: 'Transport Fee', amount: payment.transport_fee });
    }
    if (parseFloat(payment.other_fee || 0) > 0) {
      fees.push({ label: 'Other Fee', amount: payment.other_fee });
    }
    
    return fees;
  };

  const feeBreakdown = getFeeBreakdown();
  const statusColor = getStatusColor(payment.status);

  return (
    <TouchableOpacity
      style={styles.paymentCard}
      activeOpacity={0.7}
      onPress={() => setExpanded(!expanded)}
    >
      {/* Receipt Badge */}
      <LinearGradient
        colors={[statusColor, statusColor + 'DD']}
        style={styles.receiptBadge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.badgeStripe} />
        <Text style={styles.receiptBadgeText}>RECEIPT #{payment.receipt_id}</Text>
        <View style={styles.badgeDot} />
      </LinearGradient>

      {/* Card Header */}
      <View style={styles.paymentHeader}>
        <View style={[styles.paymentIcon, { backgroundColor: statusColor + '25' }]}>
          <Ionicons name="receipt" size={28} color={statusColor} />
          <View style={[styles.iconDot, { backgroundColor: statusColor }]} />
        </View>
        
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentMonth}>{payment.paid_month.toUpperCase()}</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateIconContainer}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.paymentDate}>{formatDate(payment.paid_date)}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { 
          backgroundColor: statusColor + '20',
          borderColor: statusColor + '40'
        }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {payment.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Amount Section */}
      <View style={styles.amountSection}>
        <View style={styles.amountRow}>
          <View style={styles.amountLabelContainer}>
            <View style={styles.amountDot} />
            <Text style={styles.amountLabel}>Total Amount:</Text>
          </View>
          <Text style={styles.amountValue}>{formatCurrency(payment.total)}</Text>
        </View>
        <View style={styles.amountRow}>
          <View style={styles.amountLabelContainer}>
            <View style={styles.amountDot} />
            <Text style={styles.amountLabel}>Paid Amount:</Text>
          </View>
          <Text style={[styles.amountValue, { color: COLORS.success }]}>
            {formatCurrency(payment.paid_amount)}
          </Text>
        </View>
        {parseFloat(payment.current_dues || 0) > 0 && (
          <View style={styles.amountRow}>
            <View style={styles.amountLabelContainer}>
              <View style={styles.amountDot} />
              <Text style={styles.amountLabel}>Current Dues:</Text>
            </View>
            <Text style={[styles.amountValue, { color: COLORS.error }]}>
              {formatCurrency(payment.current_dues)}
            </Text>
          </View>
        )}
      </View>

      {/* Expandable Fee Breakdown */}
      {expanded && feeBreakdown.length > 0 && (
        <View style={styles.feeBreakdown}>
          <View style={styles.breakdownHeader}>
            <View style={styles.breakdownIconContainer}>
              <Ionicons name="list" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.breakdownTitle}>FEE BREAKDOWN</Text>
          </View>
          {feeBreakdown.map((fee, idx) => (
            <View key={idx} style={styles.feeRow}>
              <View style={styles.feeDot} />
              <Text style={styles.feeLabel}>{fee.label}</Text>
              <Text style={styles.feeAmount}>{formatCurrency(fee.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Remarks */}
      {expanded && payment.remarks && (
        <View style={styles.remarksSection}>
          <View style={styles.remarksStripe} />
          <View style={styles.remarksIconContainer}>
            <Ionicons name="document-text" size={16} color={COLORS.warning} />
          </View>
          <View style={styles.remarksContent}>
            <Text style={styles.remarksLabel}>REMARKS:</Text>
            <Text style={styles.remarksText}>{payment.remarks}</Text>
          </View>
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setExpanded(!expanded)}
      >
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={COLORS.secondary} 
        />
        <Text style={styles.expandButtonText}>
          {expanded ? 'SHOW LESS' : 'VIEW DETAILS'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1.5,
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
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  headerUnderline: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.white,
    opacity: 0.95,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  statStripe: {
    position: 'absolute',
    bottom: -15,
    width: 30,
    height: 3,
    backgroundColor: COLORS.accent,
  },
  duesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 115, 85, 0.25)',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 15,
    gap: 12,
    borderWidth: 2,
    borderColor: COLORS.accent + '60',
    position: 'relative',
  },
  duesStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 13,
  },
  duesIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  duesContent: {
    flex: 1,
  },
  duesLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.95,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  duesAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  duesBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  duesDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.white,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    gap: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.dark,
  },
  filterStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.dark,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  countBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  countText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  countTextActive: {
    color: COLORS.white,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    padding: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textPrimary,
    marginTop: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  paymentCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  receiptBadge: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeStripe: {
    width: 3,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
  },
  receiptBadgeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 1.2,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 12,
  },
  paymentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(74, 93, 35, 0.2)',
    position: 'relative',
  },
  iconDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentMonth: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.textSecondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  amountSection: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 10,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  feeBreakdown: {
    backgroundColor: COLORS.background,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  breakdownIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  feeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
    marginRight: 10,
  },
  feeLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  remarksSection: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '15',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.warning + '40',
    position: 'relative',
  },
  remarksStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.warning,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  remarksIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.warning + '25',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.warning + '50',
  },
  remarksContent: {
    flex: 1,
  },
  remarksLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  remarksText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 0.8,
  },
});