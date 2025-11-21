import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets
} from 'react-native-safe-area-context';

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

const ExamReportScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [examList, setExamList] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [examListLoading, setExamListLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examModalVisible, setExamModalVisible] = useState(false);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
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
      })
    ]).start();
  }, []);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    await getStudentId();
    await fetchExamList();
  };

  const getStudentId = async () => {
    try {
      const id = await AsyncStorage.getItem('student_id');
      if (id) {
        setStudentId(id);
      } else {
        Alert.alert('Error', 'Student ID not found. Please login again.');
      }
    } catch (error) {
      console.error('Error getting student ID:', error);
      Alert.alert('Error', 'Failed to retrieve student information.');
    }
  };

  const fetchExamList = async () => {
    setExamListLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=get_exam'
      );

      if (!response.ok) {
        throw new Error('Failed to fetch exam list');
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const activeExams = data.filter(exam => exam.status === 'ACTIVE');
        
        if (activeExams.length > 0) {
          setExamList(activeExams);
          setSelectedExam(activeExams[0]);
          await fetchMarksReport(activeExams[0].exam_name);
        } else {
          throw new Error('No active exams found');
        }
      } else {
        throw new Error('No exams found');
      }
    } catch (error) {
      console.error('Error fetching exam list:', error);
      setError('Failed to load exam list. Please try again.');
      Alert.alert('Error', 'Failed to load exam list. Please check your connection.');
    } finally {
      setExamListLoading(false);
    }
  };

  const fetchMarksReport = async (examName) => {
    if (!studentId || !examName) {
      Alert.alert('Error', 'Please select an exam');
      return;
    }

    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=get_marks',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: studentId,
            exam_name: examName,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch marks');
      }

      const data = await response.json();

      if (data.status === 'success') {
        setReportData(data);
      } else {
        throw new Error(data.message || 'Failed to fetch marks');
      }
    } catch (error) {
      console.error('Error fetching marks:', error);
      setError('Failed to load report. Please try again.');
      Alert.alert('Error', 'Failed to load exam report. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleExamChange = (exam) => {
    setSelectedExam(exam);
    setExamModalVisible(false);
    fetchMarksReport(exam.exam_name);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleOpenMarksheet = async () => {
    if (!studentId || !selectedExam) {
      Alert.alert('Error', 'Please select an exam first');
      return;
    }

    try {
      const url = `https://abma.org.in/binex/exam_report_pdf?student_id=${studentId}&exam_name=${encodeURIComponent(selectedExam.exam_name)}`;
      
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open marksheet');
      }
    } catch (error) {
      console.error('Error opening marksheet:', error);
      Alert.alert('Error', 'Failed to open marksheet. Please try again.');
    }
  };

  const calculatePercentage = () => {
    if (!reportData || !reportData.subjects) return 0;
    const maxMarks = reportData.subjects.length * 50;
    return ((reportData.grand_total / maxMarks) * 100).toFixed(2);
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A1', color: COLORS.success };
    if (percentage >= 80) return { grade: 'A2', color: COLORS.success };
    if (percentage >= 70) return { grade: 'B1', color: COLORS.secondary };
    if (percentage >= 60) return { grade: 'B2', color: COLORS.warning };
    if (percentage >= 50) return { grade: 'C', color: COLORS.warning };
    return { grade: 'D', color: COLORS.error };
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+': return COLORS.success;
      case 'A': return COLORS.success;
      case 'B+': return COLORS.secondary;
      case 'B': return COLORS.secondary;
      case 'C': return COLORS.warning;
      case 'D': return COLORS.error;
      case 'N/A': return COLORS.gray;
      default: return COLORS.gray;
    }
  };

  const renderHeaderWithExamSelector = () => (
    <View style={styles.unifiedHeader}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.darkAccent]}
        style={styles.unifiedHeaderGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header Navigation */}
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="arrow-left" size={20} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EXAM REPORT</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => {
              Alert.alert(
                "Exam Report Information",
                "This screen shows your exam performance with detailed subject-wise marks breakdown and co-scholastic activities.",
                [{ text: "OK" }]
              );
            }}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="info-circle" size={20} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

        {/* Exam Selector Inside Header */}
        <View style={styles.examSelectorContent}>
          <View style={styles.examSelectorHeader}>
            <Ionicons name="document-text" size={22} color={COLORS.accent} />
            <Text style={styles.examSelectorTitle}>SELECT EXAM</Text>
          </View>
          <TouchableOpacity
            style={styles.examSelector}
            onPress={() => setExamModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="clipboard-outline"
              size={20}
              color={COLORS.primary}
              style={styles.selectorIcon}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.examSelectorText}>
                {selectedExam ? selectedExam.exam_name : 'Select exam'}
              </Text>
              {selectedExam && (
                <Text style={styles.examDateText}>
                  {formatDate(selectedExam.start_date)} - {formatDate(selectedExam.end_date)}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const ExamSelectionModal = () => (
    <Modal
      visible={examModalVisible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={() => setExamModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setExamModalVisible(false)}
        />
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>SELECT EXAM</Text>
            <FlatList
              data={examList}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.modalItem,
                    pressed && styles.modalItemPressed,
                    selectedExam?.id === item.id && styles.selectedModalItem
                  ]}
                  onPress={() => handleExamChange(item)}
                  android_ripple={{ color: 'rgba(44, 62, 35, 0.1)' }}
                >
                  <View style={styles.examIconContainer}>
                    <Ionicons name="document-text" size={20} color={COLORS.accent} />
                  </View>
                  <View style={styles.modalItemContent}>
                    <Text style={styles.modalItemText}>{item.exam_name}</Text>
                    <View style={styles.examDateContainer}>
                      <Ionicons name="calendar-outline" size={12} color={COLORS.gray} />
                      <Text style={styles.examDateSubText}>
                        {formatDate(item.start_date)} - {formatDate(item.end_date)}
                      </Text>
                    </View>
                    {item.status === 'ACTIVE' && (
                      <View style={styles.activeStatusBadge}>
                        <Text style={styles.activeStatusText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  {selectedExam?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  )}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
              contentContainerStyle={styles.modalList}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setExamModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderStudentInfo = () => {
    if (!reportData) return null;

    const percentage = calculatePercentage();
    const gradeInfo = getGrade(percentage);

    return (
      <Animated.View 
        style={[
          styles.studentCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary, COLORS.darkAccent]}
          style={styles.studentCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.studentHeader}>
            <View style={styles.studentIconContainer}>
              <Ionicons name="person" size={32} color={COLORS.accent} />
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{reportData.student.name}</Text>
              <View style={styles.studentMetaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="school-outline" size={14} color={COLORS.accent} />
                  <Text style={styles.metaValue}>CLASS {reportData.student.class}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="card-outline" size={14} color={COLORS.accent} />
                  <Text style={styles.metaValue}>ID: {reportData.student.id}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.performanceRow}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>TOTAL MARKS</Text>
              <Text style={styles.performanceValue}>{reportData.grand_total}</Text>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>PERCENTAGE</Text>
              <Text style={styles.performanceValue}>{percentage}%</Text>
            </View>
            <View style={styles.performanceDivider} />
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>GRADE</Text>
              <View style={[styles.gradeBadge, { backgroundColor: COLORS.accent }]}>
                <Text style={[styles.gradeText, { color: COLORS.primary }]}>
                  {gradeInfo.grade}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderMarksheetButton = () => {
    if (!reportData || !studentId || !selectedExam) return null;

    return (
      <Animated.View 
        style={[
          styles.marksheetButtonContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.marksheetButton}
          onPress={handleOpenMarksheet}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.accent, COLORS.warning]}
            style={styles.marksheetButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="document-text" size={24} color={COLORS.primary} />
            <Text style={styles.marksheetButtonText}>DOWNLOAD MARKSHEET</Text>
            <Ionicons name="download-outline" size={20} color={COLORS.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderScholasticTable = () => {
    if (!reportData || !reportData.subjects) return null;

    return (
      <Animated.View 
        style={[
          styles.reportCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.reportHeader}>
          <Ionicons name="book" size={24} color={COLORS.accent} />
          <Text style={styles.reportTitle}>SCHOLASTIC AREAS</Text>
        </View>

        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.subjectColumn]}>SUBJECT</Text>
            <Text style={[styles.tableHeaderText, styles.markColumn]}>NB</Text>
            <Text style={[styles.tableHeaderText, styles.markColumn]}>SE</Text>
            <Text style={[styles.tableHeaderText, styles.markColumn]}>MO</Text>
            <Text style={[styles.tableHeaderText, styles.totalColumn]}>TOTAL</Text>
          </View>

          {/* Table Rows */}
          {reportData.subjects.map((subject, index) => (
            <View
              key={subject.subject_id}
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.evenRow : styles.oddRow,
              ]}
            >
              <View style={styles.subjectColumnContainer}>
                <View style={[styles.subjectIcon, { backgroundColor: getSubjectColor(index) }]}>
                  <Ionicons name="book" size={12} color="#fff" />
                </View>
                <Text style={styles.subjectName}>{subject.subject_name}</Text>
              </View>
              <Text style={[styles.tableCell, styles.markColumn]}>{subject.marks.nb}</Text>
              <Text style={[styles.tableCell, styles.markColumn]}>{subject.marks.se}</Text>
              <Text style={[styles.tableCell, styles.markColumn]}>{subject.marks.mo}</Text>
              <Text style={[styles.tableCell, styles.totalColumn, styles.totalMark]}>
                {subject.marks.total}
              </Text>
            </View>
          ))}

          {/* Grand Total Row */}
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.grandTotalRow}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.grandTotalContent}>
              <Ionicons name="trophy" size={20} color={COLORS.accent} />
              <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
            </View>
            <Text style={styles.grandTotalValue}>{reportData.grand_total}</Text>
          </LinearGradient>
        </View>
      </Animated.View>
    );
  };

  const renderCoScholastic = () => {
    if (!reportData || !reportData.co_scholastic || reportData.co_scholastic.length === 0) return null;

    return (
      <Animated.View 
        style={[
          styles.reportCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.reportHeader}>
          <Ionicons name="medal" size={24} color={COLORS.accent} />
          <Text style={styles.reportTitle}>CO-SCHOLASTIC AREAS</Text>
        </View>

        <View style={styles.coScholasticContainer}>
          {reportData.co_scholastic.map((activity, index) => (
            <View
              key={index}
              style={[
                styles.coScholasticRow,
                index % 2 === 0 ? styles.evenRow : styles.oddRow,
              ]}
            >
              <View style={styles.coScholasticContent}>
                <View style={[styles.activityIcon, { backgroundColor: getActivityColor(index) }]}>
                  <Ionicons name={getActivityIcon(activity.area)} size={16} color="#fff" />
                </View>
                <Text style={styles.activityName}>{activity.area}</Text>
              </View>
              <View style={[styles.gradeChip, { backgroundColor: getGradeColor(activity.grade) }]}>
                <Text style={styles.gradeChipText}>{activity.grade}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.gradeInfoBox}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.gradeInfoText}>
            GRADING SCALE: A1 (OUTSTANDING), A2 (EXCELLENT), B1 (VERY GOOD), B2 (GOOD), C (FAIR), D (NEEDS IMPROVEMENT)
          </Text>
        </View>
      </Animated.View>
    );
  };

  const getSubjectColor = (index) => {
    const colors = [COLORS.success, COLORS.secondary, COLORS.combat, COLORS.darkAccent, COLORS.primary, COLORS.success];
    return colors[index % colors.length];
  };

  const getActivityColor = (index) => {
    const colors = [COLORS.accent, COLORS.warning, COLORS.accent];
    return colors[index % colors.length];
  };

  const getActivityIcon = (area) => {
    if (area.toLowerCase().includes('work')) return 'construct-outline';
    if (area.toLowerCase().includes('health') || area.toLowerCase().includes('physical')) return 'fitness-outline';
    if (area.toLowerCase().includes('discipline')) return 'star-outline';
    if (area.toLowerCase().includes('art')) return 'color-palette-outline';
    if (area.toLowerCase().includes('music')) return 'musical-notes-outline';
    return 'ribbon-outline';
  };

  const renderError = () => (
    <View style={styles.centerContainer}>
      <View style={styles.errorIconContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.error} />
      </View>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => selectedExam && fetchMarksReport(selectedExam.exam_name)}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh" size={20} color={COLORS.accent} />
        <Text style={styles.retryButtonText}>RETRY</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.centerContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="document-text-outline" size={64} color={COLORS.lightGray} />
      </View>
      <Text style={styles.emptyText}>SELECT AN EXAM TO VIEW REPORT</Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>LOADING REPORT...</Text>
    </View>
  );

  if (examListLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={COLORS.primary} />
        <View style={styles.safeArea}>
          {renderHeaderWithExamSelector()}
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>LOADING EXAMS...</Text>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <View style={styles.safeArea}>
        {renderHeaderWithExamSelector()}

        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: 20 + insets.bottom }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            renderLoading()
          ) : error && !reportData ? (
            renderError()
          ) : reportData ? (
            <>
              {renderStudentInfo()}
              {renderMarksheetButton()}
              {renderScholasticTable()}
              {renderCoScholastic()}
            </>
          ) : (
            renderEmptyState()
          )}
        </ScrollView>

        <ExamSelectionModal />
      </View>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Unified Header with Exam Selector
  unifiedHeader: {
    overflow: 'hidden',
  },
  unifiedHeaderGradient: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 1.5,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(193, 154, 107, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  
  // Exam Selector Inside Header
  examSelectorContent: {
    gap: 10,
  },
  examSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  examSelectorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  examSelector: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  selectorIcon: {
    marginRight: 10,
  },
  examSelectorText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
  },
  examDateText: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
    fontWeight: '600',
  },
  
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
  },
  studentCard: {
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  studentCardGradient: {
    padding: 20,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  studentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(193, 154, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: COLORS.accent + '40',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  studentMetaRow: {
    flexDirection: 'row',
    gap: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaValue: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  performanceRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(193, 154, 107, 0.15)',
    borderRadius: 10,
    padding: 15,
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  performanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  performanceLabel: {
    fontSize: 11,
    color: COLORS.accent,
    marginBottom: 5,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  performanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  performanceDivider: {
    width: 1,
    backgroundColor: 'rgba(193, 154, 107, 0.3)',
  },

  // Marksheet Button
  marksheetButtonContainer: {
    marginBottom: 20,
  },
  marksheetButton: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  marksheetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  marksheetButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    flex: 1,
    textAlign: 'center',
    letterSpacing: 1,
  },

  reportCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent + '40',
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
    flex: 1,
    letterSpacing: 1,
  },
  
  // Scholastic Table
  tableContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border + '60',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '60',
  },
  evenRow: {
    backgroundColor: COLORS.cardBg,
  },
  oddRow: {
    backgroundColor: COLORS.white,
  },
  subjectColumn: {
    flex: 2,
    textAlign: 'left',
  },
  subjectColumnContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  subjectName: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    flex: 1,
  },
  markColumn: {
    flex: 1,
    textAlign: 'center',
  },
  totalColumn: {
    flex: 1,
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '600',
  },
  totalMark: {
    fontWeight: 'bold',
    color: COLORS.success,
    fontSize: 15,
  },
  grandTotalRow: {
    paddingVertical: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  grandTotalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
  },

  // Co-Scholastic
  coScholasticContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border + '60',
  },
  coScholasticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '60',
  },
  coScholasticContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityName: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    flex: 1,
  },
  gradeChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  gradeChipText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  gradeInfoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  gradeInfoText: {
    fontSize: 10,
    color: COLORS.gray,
    flex: 1,
    lineHeight: 16,
    fontWeight: '600',
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorIconContainer: {
    marginBottom: 10,
  },
  emptyIconContainer: {
    marginBottom: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '700',
    letterSpacing: 1,
  },
  errorText: {
    marginTop: 16,
    fontSize: 15,
    color: COLORS.error,
    textAlign: 'center',
    paddingHorizontal: 32,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  retryButtonText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 1,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 62, 35, 0.85)',
  },
  modalContainer: {
    justifyContent: 'flex-end',
    height: '60%',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '100%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  modalList: {
    paddingVertical: 10,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  modalItemPressed: {
    backgroundColor: 'rgba(44, 62, 35, 0.08)',
  },
  selectedModalItem: {
    backgroundColor: COLORS.cardBg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  examIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  examDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  examDateSubText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
  },
  activeStatusBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  activeStatusText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: COLORS.lightGray + '60',
    marginVertical: 2,
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  modalCloseButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default ExamReportScreen;