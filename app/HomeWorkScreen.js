import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import RenderHtml from 'react-native-render-html';

const { width, height } = Dimensions.get('window');

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
  background: '#F5F3EE',     // Off-white/Beige
  cardBg: '#FAFAF7',        // Light beige
  success: '#5D7C2F',        // Military green
  warning: '#C87533',        // Burnt orange
  textPrimary: '#2C2C2C',    // Dark gray
  textSecondary: '#5C5C5C',  // Medium gray
  border: '#D4CEBA',         // Khaki border
  borderLight: '#E5E1D3',    // Light khaki
  overlay: 'rgba(44, 62, 31, 0.85)', // Dark green overlay
};

// Military-themed subject colors
const SUBJECT_COLORS = [
  '#4A5D23',  // Olive green
  '#6B7F3A',  // Light olive
  '#8B7355',  // Tan
  '#556B2F',  // Dark olive green
  '#8B8970',  // Army green
  '#9B7653',  // Desert sand
  '#6B8E23',  // Olive drab
  '#8A9A5B',  // Moss green
  '#A0826D',  // Khaki brown
  '#5D8AA8',  // Air force blue
];

export default function HomeworkScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [homework, setHomework] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    fetchHomework();
  }, [selectedDate]);

  const fetchHomework = async () => {
    try {
      setLoading(true);
      setError('');

      const studentId = await AsyncStorage.getItem('student_id');
      
      if (!studentId) {
        router.replace('/index');
        return;
      }

      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=get_homework',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            student_id: studentId,
            hw_date: selectedDate 
          }),
        }
      );

      const data = await response.json();
      
      if (data && Array.isArray(data) && data.length > 0) {
        setHomework(data);
        
        // Cache homework
        await AsyncStorage.setItem(`homework_${selectedDate}`, JSON.stringify(data));
      } else {
        setHomework([]);
        setError('No homework found for this date');
      }
    } catch (err) {
      console.error('Error fetching homework:', err);
      setError('Failed to load homework');
      
      // Try to load cached homework
      try {
        const cachedHomework = await AsyncStorage.getItem(`homework_${selectedDate}`);
        if (cachedHomework) {
          setHomework(JSON.parse(cachedHomework));
          setError('Showing cached homework. Network error occurred.');
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
    fetchHomework();
  };

  const handleDateChange = (days) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };

  const handleDatePickerChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'set' && date) {
      setTempDate(date);
      if (Platform.OS === 'android') {
        setSelectedDate(date.toISOString().split('T')[0]);
      }
    }
  };

  const handleDatePickerConfirm = () => {
    setSelectedDate(tempDate.toISOString().split('T')[0]);
    setShowDatePicker(false);
  };

  const handleDatePickerCancel = () => {
    setShowDatePicker(false);
    setTempDate(new Date(selectedDate));
  };

  const openDatePicker = () => {
    setTempDate(new Date(selectedDate));
    setShowDatePicker(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('en-GB', options);
    }
  };

  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  };

  const isImageFile = (filename) => {
    const ext = getFileExtension(filename);
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  };

  const isPdfFile = (filename) => {
    const ext = getFileExtension(filename);
    return ext === 'pdf';
  };

  const handleFileOpen = (filename) => {
    if (!filename) return;

    const fileUrl = `https://abma.org.in/binex/required/upload/${filename}`;

    if (isImageFile(filename)) {
      // Open image in modal
      setSelectedImage(fileUrl);
      setImageModalVisible(true);
    } else if (isPdfFile(filename)) {
      // Open PDF in external viewer
      Linking.openURL(fileUrl).catch(err => {
        Alert.alert('Error', 'Cannot open PDF file');
        console.error('Error opening PDF:', err);
      });
    } else {
      // Open other files in browser
      Linking.openURL(fileUrl).catch(err => {
        Alert.alert('Error', 'Cannot open file');
        console.error('Error opening file:', err);
      });
    }
  };

  const getSubjectColor = (subjectId) => {
    const index = parseInt(subjectId) % SUBJECT_COLORS.length;
    return SUBJECT_COLORS[index];
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="book" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.loadingText}>Loading homework...</Text>
        <View style={styles.loadingBadge}>
          <Text style={styles.loadingBadgeText}>TACTICAL LOADING</Text>
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>HOMEWORK</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={24} color={COLORS.accent} />
            <Text style={styles.statLabel}>Selected Date</Text>
            <Text style={styles.statValue}>{formatDate(selectedDate)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="clipboard" size={24} color={COLORS.accent} />
            <Text style={styles.statLabel}>Assignments</Text>
            <Text style={styles.statValue}>{homework.length}</Text>
          </View>
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => handleDateChange(-1)}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dateCenterButton}
            onPress={openDatePicker}
          >
            <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => handleDateChange(1)}
          >
            <Ionicons name="chevron-forward" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="information-circle" size={18} color={COLORS.warning} />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Homework List */}
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
        {homework.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="checkmark-done-circle" size={80} color={COLORS.lightGray} />
            </View>
            <Text style={styles.emptyText}>No homework for this date</Text>
            <Text style={styles.emptySubText}>Mission accomplished! 🎖️</Text>
          </View>
        ) : (
          homework.map((item, index) => (
            <HomeworkCard
              key={item.id}
              homework={item}
              index={index}
              getSubjectColor={getSubjectColor}
              handleFileOpen={handleFileOpen}
              isImageFile={isImageFile}
              isPdfFile={isPdfFile}
            />
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close-circle" size={40} color={COLORS.white} />
          </TouchableOpacity>
          
          <Image
            source={{ uri: selectedImage }}
            style={styles.modalImage}
            resizeMode="contain"
          />
          
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => {
              Linking.openURL(selectedImage);
            }}
          >
            <LinearGradient
              colors={[COLORS.secondary, COLORS.primary]}
              style={styles.downloadGradient}
            >
              <Ionicons name="download" size={20} color={COLORS.white} />
              <Text style={styles.downloadText}>DOWNLOAD IMAGE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <>
          {Platform.OS === 'ios' ? (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showDatePicker}
              onRequestClose={handleDatePickerCancel}
            >
              <View style={styles.datePickerModalContainer}>
                <TouchableOpacity 
                  style={styles.datePickerBackdrop}
                  activeOpacity={1}
                  onPress={handleDatePickerCancel}
                />
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerHeader}>
                    <TouchableOpacity onPress={handleDatePickerCancel}>
                      <Text style={styles.datePickerCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.datePickerTitle}>SELECT DATE</Text>
                    <TouchableOpacity onPress={handleDatePickerConfirm}>
                      <Text style={styles.datePickerConfirmText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDatePickerChange}
                    textColor={COLORS.primary}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="default"
              onChange={handleDatePickerChange}
            />
          )}
        </>
      )}
    </View>
  );
}

function HomeworkCard({ homework, index, getSubjectColor, handleFileOpen, isImageFile, isPdfFile }) {
  const [expanded, setExpanded] = useState(false);
  const subjectColor = getSubjectColor(homework.subject_id);

  const getFileIcon = (filename) => {
    if (isImageFile(filename)) return 'image';
    if (isPdfFile(filename)) return 'document-text';
    return 'document-attach';
  };

  const getFileType = (filename) => {
    if (isImageFile(filename)) return 'Image';
    if (isPdfFile(filename)) return 'PDF Document';
    return 'Document';
  };

  const htmlConfig = {
    width: width - 80,
  };

  const tagsStyles = {
    body: {
      color: COLORS.textSecondary,
      fontSize: 14,
      lineHeight: 22,
    },
  };

  return (
    <View style={styles.homeworkCard}>
      {/* Subject Badge */}
      <LinearGradient
        colors={[subjectColor, subjectColor + 'DD']}
        style={styles.subjectBadge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.badgeStripe} />
        <Text style={styles.subjectBadgeText}>SUBJECT #{homework.subject_id}</Text>
        <View style={styles.badgeDot} />
      </LinearGradient>

      {/* Card Content */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.subjectIcon, { backgroundColor: subjectColor + '25' }]}>
            <Ionicons name="book" size={24} color={subjectColor} />
          </View>
          
          <View style={styles.classInfo}>
            <Text style={styles.classText}>
              CLASS {homework.hw_class} - {homework.hw_section}
            </Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.dateTextSmall}>
                {new Date(homework.hw_date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </View>

          {homework.hw_file && (
            <View style={[styles.attachmentIndicator, { backgroundColor: subjectColor + '25' }]}>
              <Ionicons name="attach" size={20} color={subjectColor} />
            </View>
          )}
        </View>

        {/* Homework Text */}
        <View style={styles.homeworkContent}>
          <View style={styles.labelContainer}>
            <View style={[styles.labelDot, { backgroundColor: subjectColor }]} />
            <Text style={styles.homeworkLabel}>ASSIGNMENT DETAILS:</Text>
          </View>
          <View style={styles.homeworkTextContainer}>
            <RenderHtml
              contentWidth={htmlConfig.width}
              source={{ html: homework.hw_text }}
              tagsStyles={tagsStyles}
            />
          </View>
        </View>

        {/* Attachment Section */}
        {homework.hw_file && (
          <View style={styles.attachmentSection}>
            <TouchableOpacity
              style={[styles.attachmentButton, { borderColor: subjectColor }]}
              onPress={() => handleFileOpen(homework.hw_file)}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: subjectColor + '25' }]}>
                <Ionicons 
                  name={getFileIcon(homework.hw_file)} 
                  size={24} 
                  color={subjectColor} 
                />
              </View>
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentName} numberOfLines={1}>
                  {homework.hw_file}
                </Text>
                <View style={styles.attachmentTypeRow}>
                  <View style={[styles.typeBadge, { backgroundColor: subjectColor + '25' }]}>
                    <Text style={[styles.attachmentType, { color: subjectColor }]}>
                      {getFileType(homework.hw_file)}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.openButton, { borderColor: subjectColor }]}>
                <Ionicons name="open-outline" size={20} color={subjectColor} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
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
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingBadge: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  loadingBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.white,
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    gap: 10,
  },
  dateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dateCenterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderRadius: 22,
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dateText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 14,
    marginHorizontal: 20,
    marginTop: 15,
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
    paddingTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontWeight: '500',
  },
  homeworkCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  subjectBadge: {
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
  subjectBadgeText: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 12,
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(74, 93, 35, 0.2)',
  },
  classInfo: {
    flex: 1,
  },
  classText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTextSmall: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  attachmentIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(74, 93, 35, 0.2)',
  },
  homeworkContent: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  homeworkLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  homeworkTextContainer: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  attachmentSection: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
  },
  attachmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(74, 93, 35, 0.2)',
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  attachmentTypeRow: {
    flexDirection: 'row',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  attachmentType: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  openButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 2,
  },
  modalImage: {
    width: width - 40,
    height: height - 200,
  },
  downloadButton: {
    position: 'absolute',
    bottom: 40,
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  downloadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  downloadText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 1,
  },
  datePickerModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  datePickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 62, 31, 0.7)',
  },
  datePickerModal: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  datePickerCancelText: {
    fontSize: 16,
    color: COLORS.error,
    fontWeight: '600',
  },
  datePickerConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
});