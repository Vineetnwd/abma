import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Import the FileUploader component
import FileUploader from './FileUploader';

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
  background: '#F5F3EE',     // Off-white/Beige
  cardBg: '#FAFAF7',        // Light beige
  success: '#5D7C2F',        // Military green
  warning: '#C87533',        // Burnt orange
  textPrimary: '#2C2C2C',    // Dark gray
  textSecondary: '#5C5C5C',  // Medium gray
  border: '#D4CEBA',         // Khaki border
  borderLight: '#E5E1D3',    // Light khaki
  inputBg: '#FFFFFF',        // White
  disabled: '#9BA082',       // Muted olive
};

export default function NoticeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Form state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeDetails, setNoticeDetails] = useState('');
  const [noticeDate, setNoticeDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  // Start animation on component mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || noticeDate;
    setShowDatePicker(Platform.OS === 'ios');
    setNoticeDate(currentDate);
  };

  // Handle file upload success
  const handleUploadSuccess = (fileInfo) => {
    console.log('File uploaded successfully:', fileInfo);
    setUploadedFileInfo(fileInfo);
  };

  // Handle file upload error
  const handleUploadError = (error) => {
    Alert.alert('Upload Error', error);
    setUploadedFileInfo(null);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!noticeTitle.trim()) {
      newErrors.title = 'Notice title is required';
    }
    
    if (!noticeDetails.trim()) {
      newErrors.details = 'Notice details are required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // Submit notice
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const formattedDate = format(noticeDate, 'yyyy-MM-dd');
      const noticeData = {
        notice_date: formattedDate,
        notice_title: noticeTitle,
        notice_details: noticeDetails,
        notice_attachment: uploadedFileInfo ? uploadedFileInfo.file_name : ''
      };
      
      console.log('Submitting notice with data:', noticeData);
      
      const response = await fetch('https://abma.org.in/binex/api.php?task=notice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(noticeData)
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setSubmitSuccess(true);
        
        setTimeout(() => {
          setNoticeTitle('');
          setNoticeDetails('');
          setNoticeDate(new Date());
          setUploadedFileInfo(null);
          setSubmitSuccess(false);
        }, 2000);
        
        console.log('Notice created successfully:', result);
      } else {
        Alert.alert('Error', 'Failed to create notice');
      }
    } catch (error) {
      console.error('Error creating notice:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Show the file information
  const FileInfoDisplay = () => {
    if (!uploadedFileInfo) return null;
    
    const isPdf = uploadedFileInfo.file_type === 'pdf';
    
    return (
      <View style={styles.fileInfoDisplay}>
        <View style={styles.fileInfoContent}>
          <View style={[
            styles.fileIconContainer, 
            {backgroundColor: isPdf ? COLORS.error : COLORS.accent}
          ]}>
            <Ionicons 
              name={isPdf ? "document-text" : "image"} 
              size={24} 
              color="white" 
            />
          </View>
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>
              {uploadedFileInfo.file_name}
            </Text>
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
        >
          <Ionicons name="close-circle" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with gradient background */}
      <LinearGradient
        colors={[COLORS.dark, COLORS.primary, COLORS.secondary]}
        style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>NOTICE BOARD</Text>
            <View style={styles.headerUnderline} />
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.notificationBadge}>
              <Ionicons name="notifications-outline" size={24} color="white" />
            </View>
          </View>
        </View>
      </LinearGradient>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.card,
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }] 
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconBadge}>
                <Ionicons name="create-outline" size={22} color="white" />
                <View style={styles.badgeStripe} />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>NOTICE INFORMATION</Text>
                <View style={styles.cardTitleUnderline} />
              </View>
            </View>
            
            {/* Notice Date */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <View style={styles.labelDot} />
                <Text style={styles.formLabel}>NOTICE DATE</Text>
              </View>
              <TouchableOpacity 
                style={styles.dateSelector}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={22} color={COLORS.primary} style={styles.inputIcon} />
                <Text style={styles.dateText}>
                  {format(noticeDate, 'dd MMMM yyyy')}
                </Text>
                <View style={styles.datePickerButton}>
                  <Ionicons name="chevron-down" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={noticeDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                />
              )}
            </View>
            
            {/* Notice Title */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <View style={styles.labelDot} />
                <Text style={styles.formLabel}>NOTICE TITLE</Text>
              </View>
              <View style={[
                styles.inputContainer,
                errors.title ? styles.inputError : {}
              ]}>
                <Ionicons name="create-outline" size={22} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter notice title"
                  value={noticeTitle}
                  onChangeText={setNoticeTitle}
                  maxLength={100}
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              {errors.title && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                  <Text style={styles.errorText}>{errors.title}</Text>
                </View>
              )}
            </View>
            
            {/* Notice Details */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <View style={styles.labelDot} />
                <Text style={styles.formLabel}>NOTICE DETAILS</Text>
              </View>
              <View style={[
                styles.textAreaContainer,
                errors.details ? styles.inputError : {}
              ]}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Enter notice details"
                  value={noticeDetails}
                  onChangeText={setNoticeDetails}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              {errors.details && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color={COLORS.error} />
                  <Text style={styles.errorText}>{errors.details}</Text>
                </View>
              )}
            </View>
            
            {/* Attachment */}
            <View style={styles.formGroup}>
              <View style={styles.labelContainer}>
                <View style={styles.labelDot} />
                <Text style={styles.formLabel}>ATTACHMENT (OPTIONAL)</Text>
              </View>
              <Text style={styles.formLabelHint}>PDF or Image up to 5MB</Text>
              
              {uploadedFileInfo ? (
                <FileInfoDisplay />
              ) : (
                <View style={styles.uploaderContainer}>
                  <FileUploader
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                    buttonTitle="UPLOAD ATTACHMENT"
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
                submitSuccess ? styles.successButton : {},
                loading ? styles.disabledButton : {}
              ]}
              onPress={handleSubmit}
              disabled={loading || submitSuccess}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.submitButtonText, { marginLeft: 10 }]}>PROCESSING...</Text>
                </View>
              ) : submitSuccess ? (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>NOTICE PUBLISHED!</Text>
                </View>
              ) : (
                <LinearGradient
                  colors={[COLORS.dark, COLORS.primary]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.buttonStripe} />
                  <Text style={styles.submitButtonText}>PUBLISH NOTICE</Text>
                  <Ionicons name="paper-plane" size={18} color="#fff" style={styles.submitIcon} />
                </LinearGradient>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Success feedback overlay */}
      {submitSuccess && (
        <Animated.View 
          style={[
            styles.successOverlay,
            { opacity: fadeAnim }
          ]}
        >
          <View style={styles.successPopup}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
            </View>
            <Text style={styles.successPopupTitle}>MISSION ACCOMPLISHED</Text>
            <Text style={styles.successPopupText}>Notice Published Successfully!</Text>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>DEPLOYED</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
    elevation: 8,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
  },
  headerUnderline: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  headerRight: {
    width: 40,
    alignItems: 'center',
  },
  notificationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 20,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.dark,
    overflow: 'visible',
  },
  badgeStripe: {
    position: 'absolute',
    width: 2,
    height: 16,
    backgroundColor: COLORS.accent,
    left: 8,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  cardTitleUnderline: {
    width: 30,
    height: 3,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  formLabelHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginTop: -4,
    fontStyle: 'italic',
    marginLeft: 14,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    height: 55,
    paddingLeft: 16,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 10,
    fontWeight: '600',
  },
  datePickerButton: {
    backgroundColor: COLORS.primary,
    height: 53,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.dark,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    height: 55,
    paddingHorizontal: 16,
    backgroundColor: COLORS.inputBg,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  textAreaContainer: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    padding: 16,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  textArea: {
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 120,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginLeft: 5,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
  },
  uploaderContainer: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderStyle: 'dashed',
  },
  fileUploader: {
    marginTop: 0,
  },
  fileInfoDisplay: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.success,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  fileInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
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
    padding: 5,
  },
  submitButton: {
    borderRadius: 10,
    height: 55,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonStripe: {
    width: 3,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
    marginRight: 5,
  },
  disabledButton: {
    backgroundColor: COLORS.disabled,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  submitIcon: {
    marginLeft: 8,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44, 62, 31, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  successPopup: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    width: width * 0.85,
    borderWidth: 3,
    borderColor: COLORS.success,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  successIconContainer: {
    backgroundColor: COLORS.success + '25',
    borderRadius: 50,
    padding: 15,
    borderWidth: 3,
    borderColor: COLORS.success,
    marginBottom: 15,
  },
  successPopupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  successPopupText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  successBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  successBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
});