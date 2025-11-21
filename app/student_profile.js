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
  primary: '#1A1F16', // Combat Black
  secondary: '#2C3E20', // Dark Military Green
  accent: '#FF6B35', // Military Signal Orange
  white: '#FFFFFF',
  gray: '#5D5D5D',
  lightGray: '#D4D4D4',
  error: '#DC3545',
  sand: '#C9A167', // Desert Sand
  camoGreen: '#4A5D23', // Dark Camo Green
  militaryYellow: '#FFA000', // Military Gold
  combatBrown: '#3E362E', // Dark field brown
  olive: '#3D4F2F', // Combat Olive
};

const FEATURES = [
  {
    id: 'attendance',
    title: 'Attendance',
    icon: 'calendar-outline',
    route: '/AttendanceScreen',
    color: '#7CB342',
    gradient: ['#7CB342', '#9CCC65'], // Bright Camo Green
  },
  {
    id: 'homework',
    title: 'Homework',
    icon: 'book-outline',
    route: '/HomeWorkScreen',
    color: '#558B2F',
    gradient: ['#558B2F', '#7CB342'], // Military Green
  },
  {
    id: 'exam-report',
    title: 'Exam Report',
    icon: 'trophy-outline',
    route: '/ExamReportScreen',
    color: '#FFB300',
    gradient: ['#FFB300', '#FDD835'], // Military Yellow/Gold
  },
  {
    id: 'noticeboard',
    title: 'Notice Board',
    icon: 'notifications-outline',
    route: '/noticeboard',
    color: '#FF6B35',
    gradient: ['#FF6B35', '#FF8A65'], // Signal Orange
  },
  {
    id: 'holiday',
    title: 'Holidays',
    icon: 'sunny-outline',
    route: '/HolidayScreen',
    color: '#8D6E63',
    gradient: ['#8D6E63', '#A1887F'], // Combat Brown
  },
  {
    id: 'leave',
    title: 'Leave Application',
    icon: 'document-text-outline',
    route: '/StudentLeaveApply',
    color: '#689F38',
    gradient: ['#689F38', '#8BC34A'], // Jungle Green
  },
  {
    id: 'payment',
    title: 'Online Payment',
    icon: 'card-outline',
    route: '/OnlinePaymentScreen',
    color: '#F4A460',
    gradient: ['#F4A460', '#FFB74D'], // Sandy/Desert Tan
  },
  {
    id: 'payment-history',
    title: 'Payment History',
    icon: 'receipt-outline',
    route: '/PaymentHistoryScreen',
    color: '#FF7043',
    gradient: ['#FF7043', '#FF8A65'], // Military Red-Orange
  },
  {
    id: 'bus',
    title: 'Live Bus Location',
    icon: 'bus-outline',
    route: '/LiveBusLocation',
    color: '#6D4C41',
    gradient: ['#6D4C41', '#8D6E63'], // Combat Gear Brown
  },
  {
    id: 'complain',
    title: 'Complain',
    icon: 'alert-circle-outline',
    route: '/ComplaintScreen',
    color: '#D84315',
    gradient: ['#D84315', '#FF6F00'], // Alert Orange-Red
  },
  {
    id: 'help',
    title: 'Help & Support',
    icon: 'help-circle-outline',
    route: '/HelpAndSupport',
    color: '#5D4037',
    gradient: ['#5D4037', '#795548'], // Field Brown
  },
  {
    id: 'rate',
    title: 'Rate & Review',
    icon: 'star-outline',
    route: '/RatingScreen',
    color: '#FFA726',
    gradient: ['#FFA726', '#FFB74D'], // Achievement Gold
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
        <ActivityIndicator size="large" color={COLORS.camoGreen} />
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
      {/* Combat Theme Header with Pure Military Gradient */}
      <LinearGradient
        colors={[
          '#1A1F16', // Combat Black
          '#2C3E20', // Dark Military Green
          '#3E362E', // Field Brown
          '#2C3E20', // Dark Military Green
          '#4A5D23', // Dark Camo Green
        ]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>⚡ WELCOME BACK, SOLDIER!</Text>
            <Text style={styles.studentName}>{student.student_name}</Text>
            <View style={styles.classInfo}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.militaryYellow} />
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
                        student.student_sex === 'MALE' ? '#2C3E20' : '#4A5D23',
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

        {/* Combat Stats */}
        <Animated.View
          style={[
            styles.statsContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <StatCard icon="cash-outline" value={`₹${student.total_paid}`} label="TOTAL PAID" />
          <StatCard icon="alert-circle-outline" value={`₹${student.current_dues??0}`} label="DUES" />
          <StatCard icon="trophy-outline" value="A+" label="RANK" />
        </Animated.View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.camoGreen]}
            tintColor={COLORS.camoGreen}
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

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>⚔️ MISSION CONTROL</Text>
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
              📢 COMMAND CENTER {notices.length > 0 && `(${notices.length})`}
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
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.lightGray} />
              <Text style={styles.noNoticesText}>NO MISSIONS AVAILABLE</Text>
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
      <Ionicons name={icon} size={22} color={COLORS.militaryYellow} />
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
          <Ionicons name="megaphone" size={24} color={COLORS.accent} />
        </View>
        <View style={styles.noticeContent}>
          <Text style={styles.noticeTitle} numberOfLines={2}>
            {notice.notice_title}
          </Text>
          <View style={styles.noticeDateContainer}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.gray} />
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
    backgroundColor: '#E8E4D9', // Light desert/sand background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E4D9',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E4D9',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  retryButton: {
    backgroundColor: COLORS.camoGreen,
    paddingHorizontal: 35,
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.error,
    gap: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '700',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
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
    fontSize: 13,
    color: COLORS.militaryYellow,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  studentName: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: COLORS.militaryYellow,
  },
  classText: {
    fontSize: 12,
    color: COLORS.white,
    marginLeft: 6,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  profileButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  profileImage: {
    width: 65,
    height: 65,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: COLORS.militaryYellow,
  },
  profilePlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.militaryYellow,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.militaryYellow,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  switchButtonText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 160, 0, 0.5)',
  },
  statValue: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.white,
    marginTop: 3,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.camoGreen,
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
    color: COLORS.gray,
    marginBottom: 5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  featuresContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 130,
    justifyContent: 'center',
  },
  featureIconContainer: {
    width: 55,
    height: 55,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noticeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.camoGreen,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noticeIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  noticeDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  noticeDate: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '700',
  },
  noticeDescription: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 20,
    marginTop: 8,
  },
  readMoreText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '800',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.camoGreen,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  downloadButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  noNoticesContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginTop: 10,
  },
  noNoticesText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});