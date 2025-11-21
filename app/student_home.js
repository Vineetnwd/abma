import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#2D3019', // Dark Military Green
  secondary: '#4B5320', // Army Olive Drab
  accent: '#B8860B', // Military Gold/Brass
  white: '#FFFFFF',
  gray: '#5D5D5D',
  lightGray: '#A8A8A8',
  error: '#8B0000', // Dark Military Red
  sand: '#C3B091', // Military Khaki
  camoGreen: '#5F6F52', // Camouflage Green
  militaryBrown: '#4A3C28', // Combat Brown
  darkOlive: '#3B3C36', // Dark Olive
  khaki: '#BDB76B', // Khaki
  militaryGold: '#DAA520', // Bright Military Gold
  earthBrown: '#654321', // Earth Brown
  combatGray: '#6B7269', // Combat Gray
};

const FEATURES = [
  {
    id: 'attendance',
    title: 'Attendance',
    icon: 'calendar-outline',
    route: '/AttendanceScreen',
    color: '#4B5320',
    gradient: ['#2D3019', '#4B5320'], // Dark Army to Olive
  },
  {
    id: 'homework',
    title: 'Homework',
    icon: 'book-outline',
    route: '/HomeWorkScreen',
    color: '#5F6F52',
    gradient: ['#3B3C36', '#5F6F52'], // Dark Olive to Camo Green
  },
  {
    id: 'exam-report',
    title: 'Exam Report',
    icon: 'trophy-outline',
    route: '/ExamReportScreen',
    color: '#B8860B',
    gradient: ['#B8860B', '#DAA520'], // Military Gold
  },
  {
    id: 'noticeboard',
    title: 'Notice Board',
    icon: 'notifications-outline',
    route: '/noticeboard',
    color: '#654321',
    gradient: ['#4A3C28', '#654321'], // Combat Brown to Earth
  },
  {
    id: 'holiday',
    title: 'Holidays',
    icon: 'sunny-outline',
    route: '/HolidayScreen',
    color: '#BDB76B',
    gradient: ['#BDB76B', '#C3B091'], // Khaki to Sand
  },
  {
    id: 'leave',
    title: 'Leave Application',
    icon: 'document-text-outline',
    route: '/StudentLeaveApply',
    color: '#5F6F52',
    gradient: ['#4B5320', '#5F6F52'], // Army Olive to Camo
  },
  {
    id: 'payment',
    title: 'Online Payment',
    icon: 'card-outline',
    route: '/OnlinePaymentScreen',
    color: '#C3B091',
    gradient: ['#BDB76B', '#C3B091'], // Khaki to Military Sand
  },
  {
    id: 'payment-history',
    title: 'Payment History',
    icon: 'receipt-outline',
    route: '/PaymentHistoryScreen',
    color: '#4A3C28',
    gradient: ['#654321', '#4A3C28'], // Earth to Combat Brown
  },
  {
    id: 'bus',
    title: 'Live Bus Location',
    icon: 'bus-outline',
    route: '/LiveBusLocation',
    color: '#6B7269',
    gradient: ['#3B3C36', '#6B7269'], // Dark Olive to Combat Gray
  },
  {
    id: 'complain',
    title: 'Complain',
    icon: 'alert-circle-outline',
    route: '/ComplaintScreen',
    color: '#8B0000',
    gradient: ['#8B0000', '#A52A2A'], // Military Red
  },
  {
    id: 'help',
    title: 'Help & Support',
    icon: 'help-circle-outline',
    route: '/HelpAndSupport',
    color: '#5F6F52',
    gradient: ['#5F6F52', '#6B7269'], // Camo to Combat Gray
  },
  {
    id: 'rate',
    title: 'Rate & Review',
    icon: 'star-outline',
    route: '/RatingScreen',
    color: '#DAA520',
    gradient: ['#B8860B', '#DAA520'], // Gold Brass
  },
];

export default function StudentHomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [student, setStudent] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [downloadingNoticeId, setDownloadingNoticeId] = useState(null);
  const [hasMultipleStudents, setHasMultipleStudents] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeScreen();
    }
  }, []);

  const initializeScreen = async () => {
    console.log('Initializing screen...');
    console.log('Params received:', params);
    
    // Load student data first
    if (params.studentData) {
      try {
        const studentData = JSON.parse(params.studentData);
        console.log('Student data loaded from params');
        setStudent(studentData);
        await AsyncStorage.setItem('student_data', JSON.stringify(studentData));
      } catch (e) {
        console.error('Error parsing student data:', e);
      }
    }

    // Load notices
    if (params.notices) {
      try {
        const noticesData = typeof params.notices === 'string' 
          ? JSON.parse(params.notices) 
          : params.notices;
        
        console.log('Notices loaded from params:', noticesData.length);
        
        if (noticesData && Array.isArray(noticesData)) {
          setNotices(noticesData);
          await AsyncStorage.setItem('notices', JSON.stringify(noticesData));
        }
      } catch (e) {
        console.error('Error parsing notices:', e);
      }
    } else {
      // Try to load from AsyncStorage
      try {
        const cachedNotices = await AsyncStorage.getItem('notices');
        if (cachedNotices) {
          const parsedNotices = JSON.parse(cachedNotices);
          console.log('Notices loaded from cache:', parsedNotices.length);
          setNotices(parsedNotices);
        }
      } catch (e) {
        console.error('Error loading cached notices:', e);
      }
    }

    // Check if there are multiple students
    try {
      const studentsData = await AsyncStorage.getItem('all_students');
      if (studentsData) {
        const students = JSON.parse(studentsData);
        if (students && students.length > 1) {
          setHasMultipleStudents(true);
          setAllStudents(students);
        }
      }
    } catch (e) {
      console.error('Error checking multiple students:', e);
    }

    await fetchStudentProfile();
  };

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const studentId = await AsyncStorage.getItem('student_id');
      
      if (!studentId) {
        router.replace('/');
        return;
      }

      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=get_student_profile',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: studentId,
          }),
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const studentData = data[0];
        setStudent(studentData);
        
        await AsyncStorage.setItem('student_data', JSON.stringify(studentData));

        // Start animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setError('Unable to load profile. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setError('Network error. Please check your connection.');
      
      const cachedData = await AsyncStorage.getItem('student_data');
      if (cachedData) {
        setStudent(JSON.parse(cachedData));
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudentProfile();
    setRefreshing(false);
  };

  const handleSwitchStudent = () => {
    Alert.alert(
      'Switch Student',
      'Do you want to switch to another student profile?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Switch',
          onPress: () => {
            router.push({
              pathname: '/student-selection',
              params: {
                students: JSON.stringify(allStudents),
                notices: JSON.stringify(notices),
              },
            });
          },
        },
      ],
    );
  };

  const handleViewAllNotices = () => {
    router.push({
      pathname: '/noticeboard',
      params: {
        notices: JSON.stringify(notices),
      },
    });
  };

  const handleDownloadAttachment = async (noticeId, attachment, title) => {
    if (!attachment) return;

    setDownloadingNoticeId(noticeId);

    try {
      const url = `https://abma.org.in/binex/required/upload/${attachment}`;
      const fileExtension = attachment.split('.').pop();
      const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
      const fileUri = FileSystem.documentDirectory + fileName;

      console.log('Downloading from:', url);

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Download progress: ${Math.round(progress * 100)}%`);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result && result.uri) {
        const fileInfo = await FileSystem.getInfoAsync(result.uri);
        
        if (fileInfo.exists && fileInfo.size > 0) {
          const isAvailable = await Sharing.isAvailableAsync();
          
          if (isAvailable) {
            await Sharing.shareAsync(result.uri, {
              dialogTitle: 'Open Notice Attachment',
            });
          } else {
            Alert.alert(
              'Success',
              'Attachment downloaded successfully!',
              [{ text: 'OK' }]
            );
          }
        } else {
          throw new Error('Downloaded file is empty or corrupted');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed', 
        'Failed to download attachment. Please try again.'
      );
    } finally {
      setDownloadingNoticeId(null);
    }
  };

  const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/Index');
          },
          style: 'destructive',
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.militaryGold} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error && !student) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStudentProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.camoGreen]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>WELCOME BACK, SOLDIER!</Text>
            <Text style={styles.studentName}>{student.student_name}</Text>
            <View style={styles.classInfo}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.militaryGold} />
              <Text style={styles.classText}>
                CLASS {student.student_class} - {student.student_section}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push({
                pathname: '/student_profile',
                params: { studentData: JSON.stringify(student) }
              })}
            >
              {student.student_photo !== 'no_image.jpg' ? (
                <Image
                  source={{
                    uri: `https://abma.org.in/binex/upload/${student.student_photo}`,
                  }}
                  style={styles.profileImage}
                />
              ) : (
                <View
                  style={[
                    styles.profilePlaceholder,
                    {
                      backgroundColor:
                        student.student_sex === 'MALE' ? '#4B5320' : '#5F6F52',
                    },
                  ]}
                >
                  <Ionicons
                    name={student.student_sex === 'MALE' ? 'person-circle' : 'female'}
                    size={50}
                    color={COLORS.white}
                  />
                </View>
              )}
            </TouchableOpacity>
            
            {/* Action Buttons Row */}
            <View style={styles.actionButtons}>
              {hasMultipleStudents && (
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={handleSwitchStudent}
                >
                  <Ionicons name="swap-horizontal" size={16} color={COLORS.primary} />
                  <Text style={styles.switchButtonText}>SWITCH</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={16} color={COLORS.white} />
                <Text style={styles.logoutButtonText}>LOGOUT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <Animated.View
          style={[
            styles.statsContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <StatCard icon="cash-outline" value={`₹${student.total_paid}`} label="TOTAL PAID" />
          <StatCard icon="alert-circle-outline" value={`₹${student.current_dues??0}`} label="CURRENT DUES" />
          <StatCard icon="trophy-outline" value="A+" label="LAST EXAM" />
        </Animated.View>
      </LinearGradient>

      {/* Features Grid */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.militaryGold]}
            tintColor={COLORS.militaryGold}
          />
        }
      >
        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={COLORS.error} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Student Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ADMISSION NO</Text>
              <Text style={styles.infoValue}>{student.student_admission}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ROLL NUMBER</Text>
              <Text style={styles.infoValue}>{student.student_roll}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>STUDENT TYPE</Text>
              <Text style={styles.infoValue}>{student.student_type}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>GENDER</Text>
              <Text style={styles.infoValue}>{student.student_sex}</Text>
            </View>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>⚔️ MISSION CONTROL ⚔️</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                index={index}
                onPress={() => router.push({
                  pathname: feature.route,
                  params: { 
                    student_id: student.id,
                    studentData: JSON.stringify(student)
                  }
                })}
                fadeAnim={fadeAnim}
              />
            ))}
          </View>
        </View>

        {/* Recent Notices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🎖️ COMMAND CENTER {notices.length > 0 && `(${notices.length})`}
            </Text>
            <TouchableOpacity onPress={handleViewAllNotices}>
              <Text style={styles.viewAll}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>
          
          {notices && notices.length > 0 ? (
            notices.slice(0, 3).map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                onDownload={handleDownloadAttachment}
                isDownloading={downloadingNoticeId === notice.id}
                formatDate={formatDate}
                stripHtmlTags={stripHtmlTags}
              />
            ))
          ) : (
            <View style={styles.noNoticesContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.combatGray} />
              <Text style={styles.noNoticesText}>NO ACTIVE MISSIONS</Text>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={20} color={COLORS.militaryGold} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FeatureCard({ feature, index, onPress, fadeAnim }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 50,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.featureCardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.featureCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={feature.gradient}
          style={styles.featureGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.featureIconContainer}>
            <Ionicons name={feature.icon} size={28} color={COLORS.white} />
          </View>
          <Text style={styles.featureTitle}>{feature.title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function NoticeCard({ notice, onDownload, isDownloading, formatDate, stripHtmlTags }) {
  const [expanded, setExpanded] = useState(false);
  const hasAttachment = notice.notice_attachment && notice.notice_attachment !== '';
  const description = stripHtmlTags(notice.notice_details);
  const shortDescription = description.length > 100 
    ? description.substring(0, 100) + '...' 
    : description;

  return (
    <View style={styles.noticeCard}>
      <View style={styles.noticeHeader}>
        <View style={styles.noticeIcon}>
          <Ionicons name="megaphone" size={24} color={COLORS.militaryGold} />
        </View>
        <View style={styles.noticeContent}>
          <Text style={styles.noticeTitle} numberOfLines={2}>
            {notice.notice_title}
          </Text>
          <View style={styles.noticeDateContainer}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.combatGray} />
            <Text style={styles.noticeDate}>{formatDate(notice.notice_date)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.noticeDescription}>
        {expanded ? description : shortDescription}
      </Text>

      {description.length > 100 && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={styles.readMoreText}>
            {expanded ? 'READ LESS' : 'READ MORE'}
          </Text>
        </TouchableOpacity>
      )}

      {hasAttachment && (
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => onDownload(notice.id, notice.notice_attachment, notice.notice_title)}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.downloadButtonText}>DOWNLOADING...</Text>
            </>
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color={COLORS.white} />
              <Text style={styles.downloadButtonText}>DOWNLOAD ATTACHMENT</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8DCC0', // Light Khaki/Desert background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8DCC0',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8DCC0',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  retryButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 2,
    borderColor: COLORS.militaryGold,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5D7D7',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    gap: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    fontSize: 12,
    color: COLORS.militaryGold,
    opacity: 0.95,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(184, 134, 11, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.militaryGold,
  },
  classText: {
    fontSize: 11,
    color: COLORS.white,
    marginLeft: 6,
    fontWeight: '800',
    letterSpacing: 1,
  },
  profileButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImage: {
    width: 65,
    height: 65,
    borderRadius: 4,
    borderWidth: 3,
    borderColor: COLORS.militaryGold,
  },
  profilePlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.militaryGold,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.militaryGold,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  switchButtonText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#5A0000',
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(184, 134, 11, 0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(184, 134, 11, 0.5)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.white,
    opacity: 0.95,
    marginTop: 2,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.militaryGold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.combatGray,
    marginBottom: 4,
    fontWeight: '800',
    letterSpacing: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  featuresContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 15,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCardWrapper: {
    width: '48%',
    marginBottom: 15,
  },
  featureCard: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  featureGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  featureIconContainer: {
    width: 55,
    height: 55,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAll: {
    fontSize: 12,
    color: COLORS.militaryGold,
    fontWeight: '800',
    letterSpacing: 1,
  },
  noticeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  noticeIcon: {
    width: 45,
    height: 45,
    borderRadius: 4,
    backgroundColor: '#F5E6D3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.militaryGold,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  noticeDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noticeDate: {
    fontSize: 11,
    color: COLORS.combatGray,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  noticeDescription: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 20,
    marginTop: 8,
  },
  readMoreText: {
    fontSize: 12,
    color: COLORS.militaryGold,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginTop: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  downloadButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  noNoticesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  noNoticesText: {
    fontSize: 13,
    color: COLORS.combatGray,
    marginTop: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});