import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
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
  active: '#B8956A',        // Tan (Active)
  resolved: '#556B2F',      // Dark Olive Green (Resolved)
  closed: '#6B6B6B',        // Gunmetal Gray (Closed)
  warning: '#8B4513',       // Saddle Brown
};

// Army-themed complaint colors (earth tones)
const COMPLAINT_COLORS = [
  '#5F6F52',  // Army Green
  '#8B7355',  // Coyote Brown
  '#A0937D',  // Khaki
  '#6B705C',  // Sage Green
  '#8B8B7A',  // Olive Gray
  '#9A8C7B',  // Desert Tan
  '#6B6B47',  // Olive Drab
  '#8B7D6B',  // Field Drab
];

export default function AdminComplaintListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [error, setError] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [selectedFilter, searchQuery, complaints]);

  const checkAdminAccess = async () => {
    const userType = await AsyncStorage.getItem('user_type');
    if (userType !== 'ADMIN') {
      Alert.alert('Access Denied', 'This section is only for administrators.');
      router.back();
      return;
    }
    fetchComplaints();
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');

      const userType = await AsyncStorage.getItem('user_type');

      const apiResponse = await fetch(
        'https://abma.org.in/binex/api.php?task=complaints',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_type: userType }),
        }
      );

      const result = await apiResponse.json();
      
      if (result.status === 'success' && result.data && Array.isArray(result.data)) {
        setComplaints(result.data);
        await AsyncStorage.setItem('cached_admin_complaints', JSON.stringify(result.data));
      } else if (result.status === 'error') {
        setError(result.msg || 'You are not authorized');
        Alert.alert('Error', result.msg || 'You are not authorized');
        router.back();
      } else {
        setError('No complaints found');
        setComplaints([]);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Failed to load complaints');
      
      try {
        const cachedData = await AsyncStorage.getItem('cached_admin_complaints');
        if (cachedData) {
          setComplaints(JSON.parse(cachedData));
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

  const filterComplaints = () => {
    let filtered = complaints;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(complaint => 
        complaint.status.toLowerCase() === selectedFilter.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(complaint =>
        complaint.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.complaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.complaint_to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.student_class?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.student_roll?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredComplaints(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchComplaints();
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    setModalVisible(false);
    
    const updatedComplaints = complaints.map(complaint => 
      complaint.id === complaintId 
        ? { ...complaint, status: newStatus, response: response || '' }
        : complaint
    );
    setComplaints(updatedComplaints);

    try {
      const adminId = await AsyncStorage.getItem('user_id');
      
      const apiResponse = await fetch(
        'https://abma.org.in/binex/api.php?task=update_complaints',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: complaintId,
            status: newStatus,
            response: response || '',
            updated_by: adminId || '0',
          }),
        }
      );

      const result = await apiResponse.json();
      
      if (result.status === 'success') {
        Alert.alert('Success', `Complaint ${newStatus.toLowerCase()} successfully!`);
        setResponse('');
        setSelectedComplaint(null);
        
        setTimeout(() => {
          fetchComplaints();
        }, 1000);
      } else {
        Alert.alert('Error', result.msg || 'Failed to update complaint status');
        fetchComplaints();
      }
    } catch (err) {
      console.error('Error updating complaint:', err);
      Alert.alert('Error', 'Network error occurred');
      fetchComplaints();
    }
  };

  const openUpdateModal = (complaint) => {
    setSelectedComplaint(complaint);
    setResponse('');
    setModalVisible(true);
  };

  const handleCall = (mobile) => {
    if (mobile) {
      Linking.openURL(`tel:${mobile}`).catch(err => {
        Alert.alert('Error', 'Unable to make a call');
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return COLORS.active;
      case 'RESOLVED': return COLORS.resolved;
      case 'CLOSED': return COLORS.closed;
      default: return COLORS.active;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'alert-circle';
      case 'RESOLVED': return 'checkmark-circle';
      case 'CLOSED': return 'close-circle';
      default: return 'alert-circle';
    }
  };

  const getComplaintColor = (index) => {
    return COMPLAINT_COLORS[index % COMPLAINT_COLORS.length];
  };

  const stats = {
    total: complaints.length,
    active: complaints.filter(c => c.status === 'ACTIVE').length,
    resolved: complaints.filter(c => c.status === 'RESOLVED').length,
    closed: complaints.filter(c => c.status === 'CLOSED').length,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="chatbubbles" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.loadingText}>LOADING COMPLAINTS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.darkAccent]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>COMPLAINTS</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="chatbubbles" size={20} color={COLORS.accent} />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="alert-circle" size={20} color={COLORS.accent} />
            <Text style={styles.statValue}>{stats.active}</Text>
            <Text style={styles.statLabel}>ACTIVE</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
            <Text style={styles.statValue}>{stats.resolved}</Text>
            <Text style={styles.statLabel}>RESOLVED</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="close-circle" size={20} color={COLORS.accent} />
            <Text style={styles.statValue}>{stats.closed}</Text>
            <Text style={styles.statLabel}>CLOSED</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, class or complaint..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterButton
          title="ALL"
          active={selectedFilter === 'all'}
          onPress={() => setSelectedFilter('all')}
          count={complaints.length}
        />
        <FilterButton
          title="ACTIVE"
          active={selectedFilter === 'active'}
          onPress={() => setSelectedFilter('active')}
          count={stats.active}
        />
        <FilterButton
          title="RESOLVED"
          active={selectedFilter === 'resolved'}
          onPress={() => setSelectedFilter('resolved')}
          count={stats.resolved}
        />
        <FilterButton
          title="CLOSED"
          active={selectedFilter === 'closed'}
          onPress={() => setSelectedFilter('closed')}
          count={stats.closed}
        />
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="information-circle" size={16} color={COLORS.error} />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Complaints List */}
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
        {filteredComplaints.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={80} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'NO MATCHING COMPLAINTS' : 'NO COMPLAINTS FOUND'}
            </Text>
          </View>
        ) : (
          filteredComplaints.map((complaint, index) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              index={index}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              getComplaintColor={getComplaintColor}
              openUpdateModal={openUpdateModal}
              handleCall={handleCall}
            />
          ))
        )}
      </ScrollView>

      {/* Update Modal */}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>UPDATE COMPLAINT</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.gray} />
              </TouchableOpacity>
            </View>

            {selectedComplaint && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.studentCard}>
                  <View style={styles.studentCardHeader}>
                    <Ionicons name="person-circle" size={24} color={COLORS.accent} />
                    <Text style={styles.studentCardTitle}>STUDENT INFORMATION</Text>
                  </View>
                  <View style={styles.studentCardRow}>
                    <Text style={styles.modalLabel}>Name:</Text>
                    <Text style={styles.modalValue}>{selectedComplaint.student_name}</Text>
                  </View>
                  <View style={styles.studentCardRow}>
                    <Text style={styles.modalLabel}>Class:</Text>
                    <Text style={styles.modalValue}>
                      {selectedComplaint.student_class} - {selectedComplaint.student_section}
                    </Text>
                  </View>
                  <View style={styles.studentCardRow}>
                    <Text style={styles.modalLabel}>Roll No:</Text>
                    <Text style={styles.modalValue}>{selectedComplaint.student_roll}</Text>
                  </View>
                  <View style={styles.studentCardRow}>
                    <Text style={styles.modalLabel}>Mobile:</Text>
                    <TouchableOpacity onPress={() => handleCall(selectedComplaint.student_mobile)}>
                      <Text style={styles.mobileValue}>
                        <Ionicons name="call" size={14} color={COLORS.success} /> {selectedComplaint.student_mobile}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.complaintInfoModal}>
                  <Text style={styles.modalLabel}>COMPLAINT TO:</Text>
                  <Text style={styles.modalValue}>{selectedComplaint.complaint_to}</Text>
                </View>
                
                <View style={styles.complaintInfoModal}>
                  <Text style={styles.modalLabel}>COMPLAINT:</Text>
                  <Text style={styles.modalValueComplaint}>{selectedComplaint.complaint}</Text>
                </View>

                <View style={styles.responseContainer}>
                  <Text style={styles.responseLabel}>ADMIN RESPONSE:</Text>
                  <TextInput
                    style={styles.responseInput}
                    placeholder="Add your response or notes..."
                    placeholderTextColor={COLORS.gray}
                    multiline
                    numberOfLines={4}
                    value={response}
                    onChangeText={setResponse}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.resolveButton]}
                    onPress={() => {
                      Alert.alert(
                        'Resolve Complaint',
                        'Mark this complaint as resolved?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Resolve', 
                            onPress: () => handleStatusUpdate(selectedComplaint.id, 'RESOLVED')
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.accent} />
                    <Text style={styles.modalButtonText}>RESOLVE</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.closeButton]}
                    onPress={() => {
                      Alert.alert(
                        'Close Complaint',
                        'Close this complaint?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Close', 
                            style: 'destructive',
                            onPress: () => handleStatusUpdate(selectedComplaint.id, 'CLOSED')
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="close-circle" size={24} color={COLORS.accent} />
                    <Text style={styles.modalButtonText}>CLOSE</Text>
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

function FilterButton({ title, active, onPress, count }) {
  return (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
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

function ComplaintCard({ 
  complaint, 
  index,
  getStatusColor, 
  getStatusIcon,
  getComplaintColor,
  openUpdateModal,
  handleCall 
}) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = getStatusColor(complaint.status);
  const complaintColor = getComplaintColor(index);

  return (
    <View style={styles.complaintCard}>
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
      
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => setExpanded(!expanded)}
        style={styles.complaintContent}
      >
        <View style={styles.complaintHeader}>
          <View style={[styles.studentIcon, { backgroundColor: complaintColor + '20', borderColor: complaintColor + '40' }]}>
            <Ionicons name="person" size={24} color={complaintColor} />
          </View>
          
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{complaint.student_name}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={14} color={COLORS.gray} />
              <Text style={styles.classText}>
                Class {complaint.student_class}-{complaint.student_section} • Roll {complaint.student_roll}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="arrow-forward" size={14} color={COLORS.accent} />
              <Text style={styles.complaintTo}>To: {complaint.complaint_to}</Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
            <Ionicons name={getStatusIcon(complaint.status)} size={16} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {complaint.status}
            </Text>
          </View>
        </View>

        <View style={styles.complaintPreview}>
          <Text style={styles.complaintText} numberOfLines={expanded ? undefined : 2}>
            {complaint.complaint}
          </Text>
        </View>

        {expanded && (
          <View style={styles.expandedContent}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => handleCall(complaint.student_mobile)}
            >
              <Ionicons name="call" size={18} color={COLORS.success} />
              <Text style={styles.contactText}>{complaint.student_mobile}</Text>
            </TouchableOpacity>

            {complaint.response && (
              <View style={styles.responseSection}>
                <Text style={styles.responseSectionLabel}>ADMIN RESPONSE:</Text>
                <Text style={styles.responseText}>{complaint.response}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.expandButtonCard}
          onPress={() => setExpanded(!expanded)}
        >
          <Ionicons 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={COLORS.primary} 
          />
          <Text style={styles.expandButtonText}>
            {expanded ? 'SHOW LESS' : 'VIEW DETAILS'}
          </Text>
        </TouchableOpacity>

        {complaint.status === 'ACTIVE' && (
          <TouchableOpacity 
            style={styles.updateButton}
            onPress={() => openUpdateModal(complaint)}
          >
            <Ionicons name="create" size={20} color={COLORS.accent} />
            <Text style={styles.updateButtonText}>UPDATE</Text>
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
  },
  loadingText: {
    marginTop: 20,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
    borderRadius: 8,
    backgroundColor: 'rgba(193, 154, 107, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(193, 154, 107, 0.12)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(193, 154, 107, 0.25)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.accent,
    opacity: 0.95,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
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
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.accent,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gray,
    letterSpacing: 0.5,
  },
  filterButtonTextActive: {
    color: COLORS.accent,
  },
  countBadge: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeActive: {
    backgroundColor: COLORS.accent + '30',
  },
  countText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  countTextActive: {
    color: COLORS.accent,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4E4D7',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
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
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
  complaintCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  statusBar: {
    height: 4,
  },
  complaintContent: {
    padding: 15,
  },
  complaintHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  classText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  complaintTo: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  complaintPreview: {
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  complaintText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    fontWeight: '500',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray + '50',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  contactText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  responseSection: {
    backgroundColor: COLORS.success + '10',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  responseSectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  responseText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray + '50',
  },
  expandButtonCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: COLORS.lightGray + '50',
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    gap: 6,
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 0.8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 62, 35, 0.85)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent + '30',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  modalBody: {
    padding: 20,
  },
  studentCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '60',
  },
  studentCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  studentCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  complaintInfoModal: {
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  mobileValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.success,
  },
  modalValueComplaint: {
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 22,
    fontWeight: '500',
  },
  responseContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  responseLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  responseInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.primary,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border + '40',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  resolveButton: {
    backgroundColor: COLORS.success,
  },
  closeButton: {
    backgroundColor: COLORS.closed,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 1,
  },
});