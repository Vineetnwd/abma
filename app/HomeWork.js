// HomeWork.js
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets
} from 'react-native-safe-area-context';

// Import the FileUploader component
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import FileUploader from './FileUploader';

// Army Combat Color Palette
const COLORS = {
  primary: '#4A5D23',        // Olive green
  secondary: '#6B7F3A',      // Lighter olive
  accent: '#8B7355',         // Tan/Brown
  dark: '#2C3E1F',          // Dark green
  background: '#F5F3EE',     // Off-white/Beige
  cardBg: '#FAFAF7',        // Light beige
  success: '#5D7C2F',        // Military green
  warning: '#C87533',        // Burnt orange
  error: '#8B4513',          // Saddle brown
  textPrimary: '#2C2C2C',    // Dark gray
  textSecondary: '#5C5C5C',  // Medium gray
  textLight: '#8A8A8A',      // Light gray
  border: '#D4CEBA',         // Khaki border
  borderLight: '#E5E1D3',    // Light khaki
  inputBg: '#FFFFFF',        // White
  disabled: '#9BA082',       // Muted olive
  overlay: 'rgba(44, 62, 31, 0.85)', // Dark green overlay
};

export default function HomeWork() {
  // Get safe area insets
  const insets = useSafeAreaInsets();
  
  // States for class selection
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  
  // States for subject selection
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  
  // States for homework details
  const [homeworkText, setHomeworkText] = useState('');
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentDate] = useState(new Date());
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const formattedDate = format(currentDate, 'dd MMMM yyyy');
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));

  // Animation effect on component mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch subjects when a class is selected
  useEffect(() => {
    if (selectedClass) {
      fetchSubjects();
    }
  }, [selectedClass]);

  // Reset form after successful submission
  useEffect(() => {
    if (submitSuccess) {
      const timer = setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [submitSuccess]);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      const response = await fetch('https://abma.org.in/binex/api.php?task=class_list');
      const result = await response.json();
      
      if (result.status === 'success') {
        setClasses(result.data);
      } else {
        showAlert('Error', 'Failed to fetch classes');
      }
    } catch (err) {
      showAlert('Error', 'Network error: ' + err.message);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchSubjects = async () => {
    if (!selectedClass) return;
    
    try {
      setLoadingSubjects(true);
      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=subject_list',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hw_class: selectedClass.student_class }),
        }
      );
      const result = await response.json();
      
      if (result.status === 'success') {
        setSubjects(result.data);
      } else {
        showAlert('Error', 'Failed to fetch subjects');
      }
    } catch (err) {
      showAlert('Error', 'Network error: ' + err.message);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const showAlert = (title, message) => {
    Alert.alert(
      title,
      message,
      [{ text: 'OK', style: 'default' }],
      { cancelable: true }
    );
  };

  // Handle successful file upload
  const handleUploadSuccess = (fileInfo) => {
    setUploadedFileInfo(fileInfo);
  };

  // Handle file upload error
  const handleUploadError = (error) => {
    showAlert('Upload Error', error);
    setUploadedFileInfo(null);
  };

  const resetForm = () => {
    setHomeworkText('');
    setUploadedFileInfo(null);
    setSelectedClass(null);
    setSelectedSubject(null);
  };

  const submitHomework = async () => {
    if (!selectedClass || !selectedSubject) {
      showAlert('Required Fields', 'Please select class and subject');
      return;
    }
    
    if (!homeworkText.trim()) {
      showAlert('Required Field', 'Please enter homework details');
      return;
    }

    try {
      setSubmitting(true);
      // Use the uploaded filename from the API response
      const filename = uploadedFileInfo?.file_name || '';
      
      const homeworkData = {
        task: "home_work",
        hw_class: selectedClass.student_class,
        hw_section: selectedClass.student_section,
        subject_id: selectedSubject.id,
        hw_text: homeworkText,
        hw_file: filename
      };

      console.log('Submitting homework with data:', homeworkData);

      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=home_work',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(homeworkData),
        }
      );

      const result = await response.json();
      
      if (result.status === 'success') {
        setSubmitSuccess(true);
        resetForm();
      } else {
        showAlert('Error', 'Failed to add homework: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      showAlert('Error', 'Network error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Class selection modal
  const ClassSelectionModal = () => (
    <Modal
      visible={classModalVisible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={() => setClassModalVisible(false)}
    >
      <View style={[styles.modalOverlay, {paddingTop: insets.top}]}>
        <Pressable 
          style={{flex: 1}} 
          onPress={() => setClassModalVisible(false)}
        />
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Class & Section</Text>
            {loadingClasses ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading classes...</Text>
              </View>
            ) : (
              <FlatList
                data={classes}
                keyExtractor={(item, index) => `${item.student_class}-${item.student_section}-${index}`}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalItem,
                      pressed && styles.modalItemPressed
                    ]}
                    onPress={() => {
                      setSelectedClass(item);
                      setClassModalVisible(false);
                      // Reset subject when class changes
                      setSelectedSubject(null);
                    }}
                    android_ripple={{ color: 'rgba(74, 93, 35, 0.1)' }}
                  >
                    <View style={styles.classIconContainer}>
                      <Text style={styles.classIcon}>{item.student_class}</Text>
                    </View>
                    <View style={styles.modalItemContent}>
                      <Text style={styles.modalItemText}>
                        Class {item.student_class} - Section {item.student_section}
                      </Text>
                      <Text style={styles.modalItemSubtext}>
                        {item.total} Students
                      </Text>
                    </View>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                contentContainerStyle={styles.modalList}
              />
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setClassModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Subject selection modal
  const SubjectSelectionModal = () => (
    <Modal
      visible={subjectModalVisible}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={() => setSubjectModalVisible(false)}
    >
      <View style={[styles.modalOverlay, {paddingTop: insets.top}]}>
        <Pressable 
          style={{flex: 1}} 
          onPress={() => setSubjectModalVisible(false)}
        />
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Subject</Text>
            {loadingSubjects ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading subjects...</Text>
              </View>
            ) : subjects.length > 0 ? (
              <FlatList
                data={subjects}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalItem,
                      pressed && styles.modalItemPressed
                    ]}
                    onPress={() => {
                      setSelectedSubject(item);
                      setSubjectModalVisible(false);
                    }}
                    android_ripple={{ color: 'rgba(74, 93, 35, 0.1)' }}
                  >
                    <View style={styles.subjectIconContainer}>
                      <Ionicons name="book-outline" size={20} color="#fff" />
                    </View>
                    <View style={styles.modalItemContent}>
                      <Text style={styles.modalItemText}>{item.subject_name}</Text>
                    </View>
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                contentContainerStyle={styles.modalList}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="alert-circle-outline" size={40} color={COLORS.textLight} />
                <Text style={styles.noDataText}>No subjects available for this class</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSubjectModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // File information display component
  const FileInfoDisplay = () => {
    if (!uploadedFileInfo) return null;
    
    const isPdf = uploadedFileInfo.file_type === 'pdf';
    
    return (
      <View style={styles.fileInfoDisplay}>
        <View style={styles.fileInfoContent}>
          {isPdf ? (
            <View style={styles.pdfIconContainer}>
              <Ionicons name="document-text" size={24} color="white" />
            </View>
          ) : (
            <Image 
              source={{ uri: uploadedFileInfo.file_path }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          )}
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>{uploadedFileInfo.file_name}</Text>
            <View style={styles.fileMetaContainer}>
              <Text style={styles.uploadedText}>
                <Ionicons name="checkmark-circle" size={12} color={COLORS.success} /> Uploaded
              </Text>
              <Text style={styles.fileSize}>{uploadedFileInfo.file_size}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.removeFileButton}
          onPress={() => setUploadedFileInfo(null)}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="close-circle" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    );
  };

  // Success message component
  const SuccessMessage = () => {
    if (!submitSuccess) return null;
    
    return (
      <Animated.View 
        style={[
          styles.successMessage, 
          {
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            }) }]
          }
        ]}
      >
        <Ionicons name="checkmark-circle" size={24} color="white" />
        <Text style={styles.successText}>Homework assigned successfully!</Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
        >
        
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
                <FontAwesome5 name="arrow-left" size={20} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>HomeWork</Text>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => {
                  Alert.alert(
                    "Homework Information",
                    "This screen allows you to create and assign homework to students. Select a class, subject, and provide homework details.",
                    [{ text: "OK" }]
                  );
                }}
              >
                <FontAwesome5 name="info-circle" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
          
          
          <ScrollView 
            style={styles.container} 
            contentContainerStyle={[
              styles.contentContainer,
              { paddingBottom: 20 + insets.bottom }
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View 
              style={[
                styles.card, 
                { opacity: fadeAnim }
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="create-outline" size={22} color={COLORS.primary} />
                <Text style={styles.cardHeaderText}>Create New Assignment</Text>
              </View>
              
              {/* Class Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Class and Section</Text>
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => setClassModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="people-outline" 
                    size={20} 
                    color={selectedClass ? COLORS.primary : COLORS.textLight} 
                    style={styles.selectorIcon}
                  />
                  <Text style={[
                    styles.selectorText,
                    !selectedClass && styles.selectorPlaceholder
                  ]}>
                    {selectedClass 
                      ? `Class ${selectedClass.student_class} - Section ${selectedClass.student_section}`
                      : 'Select class and section'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
              
              {/* Subject Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Subject</Text>
                <TouchableOpacity
                  style={[styles.selector, !selectedClass && styles.disabledSelector]}
                  onPress={() => {
                    if (selectedClass) setSubjectModalVisible(true);
                  }}
                  activeOpacity={selectedClass ? 0.7 : 1}
                  disabled={!selectedClass}
                >
                  <Ionicons 
                    name="book-outline" 
                    size={20} 
                    color={selectedSubject ? COLORS.primary : COLORS.textLight} 
                    style={styles.selectorIcon}
                  />
                  <Text style={[
                    styles.selectorText,
                    !selectedSubject && styles.selectorPlaceholder
                  ]}>
                    {selectedSubject 
                      ? selectedSubject.subject_name
                      : 'Select subject'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
              
              {/* Date Display */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Date</Text>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={styles.selectorIcon} />
                  <Text style={styles.dateText}>{formattedDate}</Text>
                </View>
              </View>
              
              {/* Homework Content */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Homework Details</Text>
                <TextInput
                  style={[styles.textInput, !selectedSubject && styles.disabledInput]}
                  multiline
                  numberOfLines={6}
                  placeholder="Enter homework instructions here..."
                  value={homeworkText}
                  onChangeText={setHomeworkText}
                  editable={!!selectedSubject}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
              
              {/* File Attachment - Using FileUploader Component */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Attachment (Optional)
                </Text>
                <Text style={styles.sectionSubtitle}>
                  PDF or Image up to 5MB
                </Text>
                
                {uploadedFileInfo ? (
                  <FileInfoDisplay />
                ) : (
                  <View style={!selectedSubject && styles.disabledUploader}>
                    <FileUploader
                      onUploadSuccess={handleUploadSuccess}
                      onUploadError={handleUploadError}
                      buttonTitle={selectedSubject ? "Select File" : "Select Subject First"}
                      apiUrl="https://abma.org.in/binex/api.php?task=upload"
                      maxSize={5 * 1024 * 1024}
                      allowedTypes={["jpg", "jpeg", "png", "gif", "pdf"]}
                      theme={{
                        primary: COLORS.primary,
                        success: COLORS.success,
                        error: COLORS.error,
                        warning: COLORS.warning,
                        background: COLORS.cardBg,
                        text: COLORS.textPrimary,
                      }}
                      style={styles.fileUploader}
                    />
                  </View>
                )}
              </View>
              
              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton, 
                  (!selectedSubject || submitting) && styles.disabledButton
                ]}
                onPress={submitHomework}
                disabled={!selectedSubject || submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Submit Homework</Text>
                    <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Success Message */}
            <SuccessMessage />

            {/* Modals */}
            <ClassSelectionModal />
            <SubjectSelectionModal />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 100,
    overflow: "hidden",
  },
  headerGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 70,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 15,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  selector: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectorIcon: {
    marginRight: 10,
  },
  selectorText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
    fontWeight: '500',
  },
  selectorPlaceholder: {
    color: COLORS.textLight,
    fontWeight: '400',
  },
  dateContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    textAlignVertical: 'top',
    fontSize: 15,
    minHeight: 150,
    color: COLORS.textPrimary,
  },
  // File uploader styles
  fileUploader: {
    marginTop: 5,
  },
  disabledUploader: {
    opacity: 0.6,
    pointerEvents: 'none',
  },
  fileInfoDisplay: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 2,
    borderColor: COLORS.success,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pdfIconContainer: {
    width: 42,
    height: 42,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  fileDetails: {
    marginLeft: 14,
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  fileMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  fileSize: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  uploadedText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  removeFileButton: {
    padding: 2,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.dark,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  disabledSection: {
    opacity: 0.6,
  },
  disabledSelector: {
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  disabledInput: {
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
    elevation: 0,
    shadowOpacity: 0,
    borderColor: COLORS.disabled,
  },
  
  // Success message
  successMessage: {
    marginTop: 20,
    backgroundColor: COLORS.success,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.dark,
  },
  successText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  modalContainer: {
    justifyContent: 'flex-end',
    height: '70%',
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '100%',
    borderTopWidth: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.primary,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalList: {
    paddingVertical: 10,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  modalItemPressed: {
    backgroundColor: 'rgba(74, 93, 35, 0.15)',
  },
  classIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  subjectIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  classIcon: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  modalItemSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 14,
    backgroundColor: COLORS.borderLight,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});