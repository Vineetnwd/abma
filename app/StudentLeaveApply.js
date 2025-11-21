import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
};

export default function LeaveApplyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from_date: new Date(),
    to_date: new Date(),
    cause: '',
  });
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.from_date) {
      newErrors.from_date = 'Start date is required';
    }

    if (!formData.to_date) {
      newErrors.to_date = 'End date is required';
    }

    if (formData.from_date && formData.to_date) {
      if (formData.to_date < formData.from_date) {
        newErrors.to_date = 'End date must be after start date';
      }
    }

    if (!formData.cause.trim()) {
      newErrors.cause = 'Reason for leave is required';
    } else if (formData.cause.trim().length < 10) {
      newErrors.cause = 'Reason must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix all errors before submitting');
      return;
    }

    try {
      setLoading(true);

      const studentId = await AsyncStorage.getItem('student_id');
      const branchId = await AsyncStorage.getItem('branch_id');
      
      if (!studentId) {
        Alert.alert('Error', 'Student ID not found. Please login again.');
        setLoading(false);
        router.replace('/index');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('student_id', studentId);
      formDataToSend.append('from_date', formatDateForAPI(formData.from_date));
      formDataToSend.append('to_date', formatDateForAPI(formData.to_date));
      formDataToSend.append('cause', formData.cause.trim());
      
      if (branchId) {
        formDataToSend.append('branch_id', branchId);
      }

      console.log('Submitting form data with student_id:', studentId, 'branch_id:', branchId);

      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=student_leave_apply',
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
          },
          body: formDataToSend,
        }
      );

      console.log('Response status:', response.status);

      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed data:', data);
      } catch (parseError) {
        console.error('JSON parse error. Response was:', responseText);
        
        if (responseText.includes('success') || responseText.includes('Success')) {
          Alert.alert(
            'Mission Accomplished! ✓',
            'Leave request submitted successfully. Awaiting command approval.',
            [
              {
                text: 'ROGER',
                onPress: () => {
                  setFormData({
                    from_date: new Date(),
                    to_date: new Date(),
                    cause: '',
                  });
                  setErrors({});
                  router.back();
                },
              },
            ]
          );
          return;
        }
        
        Alert.alert(
          'Server Error',
          'The server returned an invalid response. Please contact support or try again later.'
        );
        return;
      }

      if (data.status === 'success') {
        Alert.alert(
          'Mission Accomplished! ✓',
          'Leave request submitted successfully. Awaiting command approval.',
          [
            {
              text: 'ROGER',
              onPress: () => {
                setFormData({
                  from_date: new Date(),
                  to_date: new Date(),
                  cause: '',
                });
                setErrors({});
                router.back();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.msg || data.message || 'Failed to apply for leave');
      }
    } catch (err) {
      console.error('Error applying for leave:', err);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (date) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const handleFromDateChange = (event, selectedDate) => {
    setShowFromDatePicker(false);
    if (selectedDate) {
      setFormData(prevData => {
        const newData = { ...prevData, from_date: selectedDate };
        if (prevData.to_date < selectedDate) {
          newData.to_date = selectedDate;
        }
        return newData;
      });
      
      setErrors(prevErrors => ({ ...prevErrors, from_date: null }));
    }
  };

  const handleToDateChange = (event, selectedDate) => {
    setShowToDatePicker(false);
    if (selectedDate) {
      setFormData(prevData => ({ ...prevData, to_date: selectedDate }));
      setErrors(prevErrors => ({ ...prevErrors, to_date: null }));
    }
  };

  const calculateDays = () => {
    if (!formData.from_date || !formData.to_date) return 0;
    const diffTime = Math.abs(formData.to_date - formData.from_date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={[COLORS.combat, COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="shield-checkmark" size={22} color={COLORS.accent} />
            <Text style={styles.headerTitle}>LEAVE REQUEST</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="document-text" size={28} color={COLORS.accent} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoText}>
              Submit your leave application for command review
            </Text>
            {calculateDays() > 0 && (
              <View style={styles.daysCounter}>
                <Ionicons name="time-outline" size={16} color={COLORS.accent} />
                <Text style={styles.daysCounterText}>
                  {calculateDays()} {calculateDays() === 1 ? 'DAY' : 'DAYS'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* Security Banner */}
          <View style={styles.securityBanner}>
            <View style={styles.securityStripe} />
            <Text style={styles.securityText}>OFFICIAL LEAVE REQUEST FORM</Text>
            <View style={styles.securityStripe} />
          </View>

          {/* From Date */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <View style={styles.labelBadge} />
              <Text style={styles.label}>
                FROM DATE
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.dateInput, errors.from_date && styles.inputError]}
              onPress={() => setShowFromDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dateIconContainer}>
                <Ionicons name="calendar" size={20} color={COLORS.accent} />
              </View>
              <View style={styles.dateDivider} />
              <View style={styles.dateContent}>
                <Text style={styles.dateText}>
                  {formatDateForDisplay(formData.from_date)}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            {errors.from_date && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{errors.from_date}</Text>
              </View>
            )}
          </View>

          {/* To Date */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <View style={styles.labelBadge} />
              <Text style={styles.label}>
                TO DATE
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.dateInput, errors.to_date && styles.inputError]}
              onPress={() => setShowToDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.dateIconContainer}>
                <Ionicons name="calendar" size={20} color={COLORS.accent} />
              </View>
              <View style={styles.dateDivider} />
              <View style={styles.dateContent}>
                <Text style={styles.dateText}>
                  {formatDateForDisplay(formData.to_date)}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            {errors.to_date && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{errors.to_date}</Text>
              </View>
            )}
          </View>

          {/* Duration Display */}
          {!errors.to_date && !errors.from_date && calculateDays() > 0 && (
            <View style={styles.durationCard}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentLight]}
                style={styles.durationGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.durationIconContainer}>
                  <Ionicons name="time" size={28} color={COLORS.primary} />
                </View>
                <View style={styles.durationContent}>
                  <Text style={styles.durationValue}>{calculateDays()}</Text>
                  <Text style={styles.durationLabel}>
                    {calculateDays() === 1 ? 'DAY' : 'DAYS'} LEAVE
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Reason/Cause */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <View style={styles.labelBadge} />
              <Text style={styles.label}>
                REASON FOR LEAVE
              </Text>
            </View>
            <View style={[styles.textAreaContainer, errors.cause && styles.inputError]}>
              <TextInput
                style={styles.textArea}
                placeholder="Provide detailed reason for leave request..."
                placeholderTextColor={COLORS.gray}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={formData.cause}
                onChangeText={(text) => {
                  setFormData(prevData => ({ ...prevData, cause: text }));
                  setErrors(prevErrors => ({ ...prevErrors, cause: null }));
                }}
              />
              <View style={styles.textAreaFooter}>
                <Text style={styles.charCount}>
                  {formData.cause.length} characters
                </Text>
                {formData.cause.length >= 10 && (
                  <View style={styles.validIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                    <Text style={styles.validText}>VALID</Text>
                  </View>
                )}
              </View>
            </View>
            {errors.cause && (
              <View style={styles.errorContainer}>
                <Ionicons name="warning" size={14} color={COLORS.error} />
                <Text style={styles.errorText}>{errors.cause}</Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? [COLORS.gray, COLORS.gray] : [COLORS.accent, COLORS.accentLight]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.submitButtonText}>PROCESSING...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={22} color={COLORS.primary} />
                  <Text style={styles.submitButtonText}>SUBMIT REQUEST</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Important Notes */}
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <View style={styles.notesIconContainer}>
                <Ionicons name="information-circle" size={22} color={COLORS.accent} />
              </View>
              <Text style={styles.notesTitle}>OPERATIONAL GUIDELINES</Text>
            </View>
            
            <View style={styles.notesList}>
              <View style={styles.noteItem}>
                <View style={styles.noteBullet}>
                  <View style={styles.noteDot} />
                </View>
                <Text style={styles.noteText}>
                  Applications reviewed within 24-48 hours
                </Text>
              </View>
              <View style={styles.noteItem}>
                <View style={styles.noteBullet}>
                  <View style={styles.noteDot} />
                </View>
                <Text style={styles.noteText}>
                  Provide valid reason for leave request
                </Text>
              </View>
              <View style={styles.noteItem}>
                <View style={styles.noteBullet}>
                  <View style={styles.noteDot} />
                </View>
                <Text style={styles.noteText}>
                  Notification upon approval/denial
                </Text>
              </View>
              <View style={styles.noteItem}>
                <View style={styles.noteBullet}>
                  <View style={styles.noteDot} />
                </View>
                <Text style={styles.noteText}>
                  Contact admin for urgent requests
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showFromDatePicker && (
        <DateTimePicker
          value={formData.from_date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleFromDateChange}
          minimumDate={new Date()}
        />
      )}

      {showToDatePicker && (
        <DateTimePicker
          value={formData.to_date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleToDateChange}
          minimumDate={formData.from_date}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.offWhite,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    gap: 14,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  infoIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.primary,
    lineHeight: 18,
    fontWeight: '600',
  },
  daysCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  daysCounterText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    gap: 12,
  },
  securityStripe: {
    width: 30,
    height: 3,
    backgroundColor: COLORS.accent,
  },
  securityText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  inputGroup: {
    marginBottom: 22,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  labelBadge: {
    width: 4,
    height: 16,
    backgroundColor: COLORS.accent,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.sand,
    overflow: 'hidden',
  },
  dateIconContainer: {
    width: 50,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  dateDivider: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.sand,
  },
  dateContent: {
    flex: 1,
    paddingHorizontal: 15,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
  },
  durationCard: {
    marginBottom: 22,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  durationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 16,
  },
  durationIconContainer: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(45, 58, 46, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  durationContent: {
    flex: 1,
  },
  durationValue: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  durationLabel: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: '800',
    letterSpacing: 1,
  },
  textAreaContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 15,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  textArea: {
    fontSize: 15,
    color: COLORS.primary,
    minHeight: 120,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  textAreaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.sand,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
  },
  validIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  validText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
    elevation: 5,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  notesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  notesIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  notesList: {
    gap: 12,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  noteBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 19,
    fontWeight: '500',
  },
});