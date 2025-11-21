import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const COLORS = {
  primary: '#2D3A2E',          // Dark Military Green
  secondary: '#4A5D23',        // Olive Drab
  tertiary: '#556B2F',         // Dark Olive Green
  accent: '#D4AF37',           // Military Gold
  accentLight: '#E8C468',      // Light Military Gold
  white: '#FFFFFF',
  offWhite: '#F5F5DC',         // Beige
  gray: '#6B7280',
  lightGray: '#D1D5DB',
  darkGray: '#374151',
  error: '#DC2626',            // Combat Red
  success: '#16A34A',          // Military Green
  background: '#E8E6E0',       // Light Tan
  camouflage: '#78866B',       // Camouflage Green
  sand: '#C3B091',             // Desert Sand
  combat: '#1F2937',           // Combat Black
  pending: '#F59E0B',          // Amber
  approved: '#16A34A',
  rejected: '#DC2626',
};

export default function AdminLeaveListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterLeaves();
  }, [selectedFilter, searchQuery, leaves]);

  const checkAdminAccess = async () => {
    const userType = await AsyncStorage.getItem('user_type');
    const id = await AsyncStorage.getItem('user_id');
    setUserId(id || '');
    
    if (userType !== 'ADMIN') {
      Alert.alert('Access Denied', 'This section is only for administrators.');
      router.back();
      return;
    }
    fetchLeaveApplications();
  };

  const fetchLeaveApplications = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=leave_applied',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.status === 'success' && result.data && Array.isArray(result.data)) {
        // Sort by date (newest first)
        const sortedLeaves = result.data.sort((a, b) => 
          new Date(b.from_date) - new Date(a.from_date)
        );
        setLeaves(sortedLeaves);
        
        // Cache data
        await AsyncStorage.setItem('cached_admin_leaves', JSON.stringify(sortedLeaves));
      } else {
        setError('No leave applications found');
        setLeaves([]);
      }
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError('Failed to load leave applications');
      
      // Try to load cached data
      try {
        const cachedData = await AsyncStorage.getItem('cached_admin_leaves');
        if (cachedData) {
          setLeaves(JSON.parse(cachedData));
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

  const filterLeaves = () => {
    let filtered = leaves;

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(leave => 
        (leave.status || 'PENDING').toLowerCase() === selectedFilter.toLowerCase()
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(leave =>
        leave.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.cause.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (leave.student_name && leave.student_name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredLeaves(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaveApplications();
  };

  const handleStatusUpdate = async (leaveId, newStatus) => {
    try {
      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=leave_update',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: leaveId,
            status: newStatus,
            remarks: remarks || '',
            updated_by: userId,
          }),
        }
      );

      const result = await response.json();
      
      if (result.status === 'success') {
        Alert.alert('Success', `Leave ${newStatus.toLowerCase()} successfully!`);
        setModalVisible(false);
        setRemarks('');
        setSelectedLeave(null);
        fetchLeaveApplications();
      } else {
        Alert.alert('Error', result.msg || 'Failed to update leave status');
      }
    } catch (err) {
      console.error('Error updating leave:', err);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const openUpdateModal = (leave, action) => {
    setSelectedLeave(leave);
    setModalVisible(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const calculateDays = (fromDate, toDate) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return COLORS.approved;
      case 'REJECTED': return COLORS.rejected;
      case 'PENDING': return COLORS.pending;
      default: return COLORS.pending;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'checkmark-circle';
      case 'REJECTED': return 'close-circle';
      case 'PENDING': return 'time';
      default: return 'time';
    }
  };

  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => !l.status || l.status === 'PENDING').length,
    approved: leaves.filter(l => l.status === 'APPROVED').length,
    rejected: leaves.filter(l => l.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[COLORS.combat, COLORS.primary, COLORS.secondary]}
        style={styles.loadingContainer}
      >
        <View style={styles.logoCircle}>
          <Ionicons name="shield-checkmark" size={50} color={COLORS.accent} />
        </View>
        <Text style={styles.loadingText}>LOADING OPERATIONS...</Text>
        <View style={styles.loadingBar}>
          <View style={styles.loadingBarInner} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.combat, COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="shield-checkmark" size={24} color={COLORS.accent} />
            <Text style={styles.headerTitle}>LEAVE OPERATIONS</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="reload" size={24} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {/* Stats - Military Style */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon="documents"
              value={stats.total}
              label="TOTAL"
              color={COLORS.accent}
            />
            <StatCard
              icon="time"
              value={stats.pending}
              label="PENDING"
              color={COLORS.pending}
            />
            <StatCard
              icon="checkmark-circle"
              value={stats.approved}
              label="APPROVED"
              color={COLORS.approved}
            />
            <StatCard
              icon="close-circle"
              value={stats.rejected}
              label="REJECTED"
              color={COLORS.rejected}
            />
          </View>
        </View>

        {/* Search Bar - Military Style */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={20} color={COLORS.accent} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="SEARCH OPERATIONS..."
              placeholderTextColor={COLORS.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={22} color={COLORS.gray} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </LinearGradient>

      {/* Filter Buttons - Military Style */}
      <View style={styles.filterContainer}>
        <FilterButton
          title="ALL"
          active={selectedFilter === 'all'}
          onPress={() => setSelectedFilter('all')}
          count={leaves.length}
        />
        <FilterButton
          title="PENDING"
          active={selectedFilter === 'pending'}
          onPress={() => setSelectedFilter('pending')}
          count={stats.pending}
        />
        <FilterButton
          title="APPROVED"
          active={selectedFilter === 'approved'}
          onPress={() => setSelectedFilter('approved')}
          count={stats.approved}
        />
        <FilterButton
          title="REJECTED"
          active={selectedFilter === 'rejected'}
          onPress={() => setSelectedFilter('rejected')}
          count={stats.rejected}
        />
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={18} color="#DC6803" />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Leave List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.accent]}
            tintColor={COLORS.accent}
          />
        }
      >
        {filteredLeaves.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-text-outline" size={80} color={COLORS.sand} />
            </View>
            <Text style={styles.emptyText}>
              {searchQuery ? 'NO MATCHING OPERATIONS' : 'NO LEAVE APPLICATIONS'}
            </Text>
            <Text style={styles.emptySubtext}>
              All clear on the roster
            </Text>
          </View>
        ) : (
          filteredLeaves.map((leave) => (
            <LeaveCard
              key={leave.id}
              leave={leave}
              formatDate={formatDate}
              calculateDays={calculateDays}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              openUpdateModal={openUpdateModal}
            />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Update Modal - Military Style */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[COLORS.secondary, COLORS.tertiary]}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalIconBadge}>
                  <Ionicons name="shield-checkmark" size={24} color={COLORS.accent} />
                </View>
                <Text style={styles.modalTitle}>UPDATE STATUS</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.accent} />
              </TouchableOpacity>
            </LinearGradient>

            {selectedLeave && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalInfoCard}>
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalLabelContainer}>
                      <View style={styles.modalLabelBadge} />
                      <Text style={styles.modalLabel}>CADET ID:</Text>
                    </View>
                    <Text style={styles.modalValue}>{selectedLeave.student_id}</Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalLabelContainer}>
                      <View style={styles.modalLabelBadge} />
                      <Text style={styles.modalLabel}>DURATION:</Text>
                    </View>
                    <Text style={styles.modalValue}>
                      {formatDate(selectedLeave.from_date)} - {formatDate(selectedLeave.to_date)}
                    </Text>
                  </View>

                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalLabelContainer}>
                      <View style={styles.modalLabelBadge} />
                      <Text style={styles.modalLabel}>DAYS:</Text>
                    </View>
                    <Text style={styles.modalValue}>
                      {calculateDays(selectedLeave.from_date, selectedLeave.to_date)} Days
                    </Text>
                  </View>
                </View>

                <View style={styles.reasonCard}>
                  <View style={styles.reasonHeader}>
                    <Ionicons name="document-text" size={18} color={COLORS.primary} />
                    <Text style={styles.reasonHeaderText}>REASON FOR LEAVE:</Text>
                  </View>
                  <Text style={styles.modalValueReason}>{selectedLeave.cause}</Text>
                </View>

                <View style={styles.remarksContainer}>
                  <View style={styles.remarksHeader}>
                    <View style={styles.remarksLabelBadge} />
                    <Text style={styles.remarksLabel}>ADMIN REMARKS</Text>
                    <Text style={styles.remarksOptional}>(Optional)</Text>
                  </View>
                  <View style={styles.remarksInputContainer}>
                    <TextInput
                      style={styles.remarksInput}
                      placeholder="Add operational notes or instructions..."
                      placeholderTextColor={COLORS.gray}
                      multiline
                      numberOfLines={4}
                      value={remarks}
                      onChangeText={setRemarks}
                    />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.approveButton]}
                    onPress={() => {
                      Alert.alert(
                        'Approve Leave',
                        'Authorize this leave request?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Approve', 
                            onPress: () => handleStatusUpdate(selectedLeave.id, 'APPROVED')
                          }
                        ]
                      );
                    }}
                  >
                    <LinearGradient
                      colors={[COLORS.approved, '#22C55E']}
                      style={styles.modalButtonGradient}
                    >
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
                      <Text style={styles.modalButtonText}>APPROVE</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.rejectButton]}
                    onPress={() => {
                      Alert.alert(
                        'Reject Leave',
                        'Deny this leave request?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Reject', 
                            style: 'destructive',
                            onPress: () => handleStatusUpdate(selectedLeave.id, 'REJECTED')
                          }
                        ]
                      );
                    }}
                  >
                    <LinearGradient
                      colors={[COLORS.rejected, '#EF4444']}
                      style={styles.modalButtonGradient}
                    >
                      <Ionicons name="close-circle" size={24} color={COLORS.white} />
                      <Text style={styles.modalButtonText}>REJECT</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FilterButton({ title, active, onPress, count }) {
  return (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
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

function LeaveCard({ 
  leave, 
  formatDate, 
  calculateDays, 
  getStatusColor, 
  getStatusIcon,
  openUpdateModal 
}) {
  const [expanded, setExpanded] = useState(false);
  const status = leave.status || 'PENDING';
  const statusColor = getStatusColor(status);
  const days = calculateDays(leave.from_date, leave.to_date);

  return (
    <View style={styles.leaveCard}>
      <LinearGradient
        colors={[statusColor + '15', statusColor + '05']}
        style={styles.statusBar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
      
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => setExpanded(!expanded)}
        style={styles.leaveContent}
      >
        <View style={styles.leaveHeader}>
          <View style={[styles.studentIcon, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
            <Ionicons name="person" size={26} color={statusColor} />
          </View>
          
          <View style={styles.studentInfo}>
            <View style={styles.studentIdRow}>
              <View style={styles.idBadge} />
              <Text style={styles.studentId}>CADET #{leave.student_id}</Text>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.gray} />
              <Text style={styles.dateText}>
                {formatDate(leave.from_date)} - {formatDate(leave.to_date)}
              </Text>
            </View>
            <View style={styles.daysRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.accent} />
              <Text style={styles.daysText}>{days} {days === 1 ? 'DAY' : 'DAYS'}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor, borderColor: statusColor }]}>
            <Ionicons name={getStatusIcon(status)} size={16} color={COLORS.white} />
            <Text style={styles.statusText}>
              {status}
            </Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.expandedContent}>
            <View style={styles.reasonSection}>
              <View style={styles.reasonHeaderCard}>
                <Ionicons name="document-text-outline" size={16} color={COLORS.primary} />
                <Text style={styles.reasonLabel}>MISSION BRIEF:</Text>
              </View>
              <Text style={styles.reasonText}>{leave.cause}</Text>
            </View>

            {leave.remarks && (
              <View style={styles.remarksSection}>
                <View style={styles.remarksHeaderCard}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#DC6803" />
                  <Text style={styles.remarksLabelCard}>COMMAND NOTES:</Text>
                </View>
                <Text style={styles.remarksTextCard}>{leave.remarks}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.expandButtonCard}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={COLORS.primary} 
          />
          <Text style={styles.expandButtonText}>
            {expanded ? 'MINIMIZE' : 'VIEW DETAILS'}
          </Text>
        </TouchableOpacity>

        {status === 'PENDING' && (
          <TouchableOpacity 
            style={styles.updateButton}
            onPress={() => openUpdateModal(leave)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentLight]}
              style={styles.updateButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
              <Text style={styles.updateButtonText}>UPDATE</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: COLORS.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingText: {
    marginTop: 25,
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '900',
    letterSpacing: 2,
  },
  loadingBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    marginTop: 15,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBarInner: {
    width: '70%',
    height: '100%',
    backgroundColor: COLORS.accent,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 2,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(232, 230, 224, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.sand,
    fontWeight: '700',
    letterSpacing: 1,
  },
  searchWrapper: {
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.offWhite,
    borderRadius: 12,
    paddingRight: 15,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  searchIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 2,
    borderRightColor: COLORS.sand,
  },
  searchInput: {
    flex: 1,
    marginLeft: 15,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    gap: 4,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  filterButtonActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  filterButtonTextActive: {
    color: COLORS.primary,
  },
  countBadge: {
    backgroundColor: COLORS.sand,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: COLORS.primary,
  },
  countText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
  },
  countTextActive: {
    color: COLORS.accent,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#DC6803',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
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
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.sand,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '600',
  },
  leaveCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  statusBar: {
    height: 6,
  },
  leaveContent: {
    padding: 16,
  },
  leaveHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  studentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 3,
  },
  studentInfo: {
    flex: 1,
  },
  studentIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  idBadge: {
    width: 4,
    height: 16,
    backgroundColor: COLORS.accent,
  },
  studentId: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  daysText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
    borderWidth: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: COLORS.sand,
  },
  reasonSection: {
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  reasonHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  reasonText: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    fontWeight: '500',
  },
  remarksSection: {
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  remarksHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  remarksLabelCard: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC6803',
    letterSpacing: 1,
  },
  remarksTextCard: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: COLORS.sand,
  },
  expandButtonCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
    borderRightWidth: 2,
    borderRightColor: COLORS.sand,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  updateButton: {
    flex: 1,
    overflow: 'hidden',
  },
  updateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  updateButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
  },
  modalContent: {
    backgroundColor: COLORS.offWhite,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '85%',
    borderTopWidth: 4,
    borderTopColor: COLORS.accent,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
  },
  modalBody: {
    padding: 20,
  },
  modalInfoCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  modalInfoRow: {
    marginBottom: 12,
  },
  modalLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modalLabelBadge: {
    width: 4,
    height: 14,
    backgroundColor: COLORS.accent,
  },
  modalLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reasonCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  reasonHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  modalValueReason: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 22,
    fontWeight: '500',
  },
  remarksContainer: {
    marginBottom: 20,
  },
  remarksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  remarksLabelBadge: {
    width: 4,
    height: 16,
    backgroundColor: COLORS.accent,
  },
  remarksLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  remarksOptional: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
  },
  remarksInputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  remarksInput: {
    padding: 14,
    fontSize: 14,
    color: COLORS.primary,
    minHeight: 90,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1.5,
  },
});