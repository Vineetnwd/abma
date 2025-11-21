import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const COMPLAINT_TO_OPTIONS = [
  { label: 'ADMIN', value: 'ADMIN' },
  { label: 'ACCOUNT', value: 'ACCOUNT' },
];

export default function ComplaintScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    complaint_date: new Date().toISOString().split('T')[0],
    complaint_to: 'ADMIN',
    complaint: '',
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.complaint_date) {
      newErrors.complaint_date = 'Date is required';
    }

    if (!formData.complaint_to) {
      newErrors.complaint_to = 'Please select recipient';
    }

    if (!formData.complaint.trim()) {
      newErrors.complaint = 'Complaint message is required';
    } else if (formData.complaint.trim().length < 10) {
      newErrors.complaint = 'Complaint must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const studentId = await AsyncStorage.getItem('student_id');
      
      if (!studentId) {
        Alert.alert('Error', 'Student ID not found. Please login again.');
        router.replace('/index');
        return;
      }

      const payload = {
        student_id: studentId,
        complaint_date: formData.complaint_date,
        complaint_to: formData.complaint_to,
        complaint: formData.complaint.trim(),
        status: 'ACTIVE',
      };

      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=send_complaint',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        Alert.alert(
          'Success', 'Your complaint has been submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setFormData({
                  complaint_date: new Date().toISOString().split('T')[0],
                  complaint_to: 'ADMIN',
                  complaint: '',
                });
                setErrors({});
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.msg || 'Failed to submit complaint');
      }
    } catch (err) {
      console.error('Error submitting complaint:', err);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const handleDateChange = (days) => {
    const currentDate = new Date(formData.complaint_date);
    currentDate.setDate(currentDate.getDate() + days);
    setFormData({
      ...formData,
      complaint_date: currentDate.toISOString().split('T')[0],
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary, COLORS.darkAccent]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.accent} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SUBMIT COMPLAINT</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="chatbox-ellipses" size={32} color={COLORS.accent} />
          </View>
          <Text style={styles.infoText}>
            Share your concerns and we'll address them promptly
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* Date Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="calendar" size={16} color={COLORS.primary} /> DATE
            </Text>
            <View style={styles.dateSelector}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => handleDateChange(-1)}
              >
                <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              
              <View style={styles.dateDisplay}>
                <Text style={styles.dateText}>
                  {formatDateForDisplay(formData.complaint_date)}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => handleDateChange(1)}
              >
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            {errors.complaint_date && (
              <Text style={styles.errorText}>{errors.complaint_date}</Text>
            )}
          </View>

          {/* Complaint To Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="person" size={16} color={COLORS.primary} /> SEND TO
            </Text>
            <TouchableOpacity
              style={[styles.dropdown, errors.complaint_to && styles.inputError]}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text style={styles.dropdownText}>{formData.complaint_to}</Text>
              <Ionicons
                name={showDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.gray}
              />
            </TouchableOpacity>
            
            {showDropdown && (
              <View style={styles.dropdownMenu}>
                {COMPLAINT_TO_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownItem,
                      formData.complaint_to === option.value && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, complaint_to: option.value });
                      setShowDropdown(false);
                      setErrors({ ...errors, complaint_to: null });
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        formData.complaint_to === option.value && styles.dropdownItemTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {formData.complaint_to === option.value && (
                      <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.complaint_to && (
              <Text style={styles.errorText}>{errors.complaint_to}</Text>
            )}
          </View>

          {/* Complaint Message */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primary} /> YOUR COMPLAINT
            </Text>
            <View style={[styles.textAreaContainer, errors.complaint && styles.inputError]}>
              <TextInput
                style={styles.textArea}
                placeholder="Describe your complaint in detail..."
                placeholderTextColor={COLORS.gray}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                value={formData.complaint}
                onChangeText={(text) => {
                  setFormData({ ...formData, complaint: text });
                  setErrors({ ...errors, complaint: null });
                }}
              />
              <Text style={styles.charCount}>
                {formData.complaint.length} CHARACTERS
              </Text>
            </View>
            {errors.complaint && (
              <Text style={styles.errorText}>{errors.complaint}</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [COLORS.gray, COLORS.gray] : [COLORS.primary, COLORS.secondary]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <>
                  <Ionicons name="send" size={20} color={COLORS.accent} />
                  <Text style={styles.submitButtonText}>SUBMIT COMPLAINT</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={22} color={COLORS.accent} />
              <Text style={styles.tipsTitle}>TIPS FOR BETTER RESPONSE</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.tipText}>Be specific and clear in your complaint</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.tipText}>Provide relevant details and context</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.tipText}>Use respectful and professional language</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
    gap: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  infoIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent + '30',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  dateButton: {
    padding: 15,
    backgroundColor: COLORS.white,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: COLORS.cardBg,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border + '30',
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  dropdownText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dropdownMenu: {
    marginTop: 10,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '60',
  },
  dropdownItemActive: {
    backgroundColor: COLORS.primary,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  dropdownItemText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dropdownItemTextActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  textAreaContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  textArea: {
    fontSize: 15,
    color: COLORS.primary,
    minHeight: 150,
    textAlignVertical: 'top',
    fontWeight: '500',
  },
  charCount: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  inputError: {
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 5,
    marginLeft: 5,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 1.2,
  },
  tipsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.lightGray + '60',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
    fontWeight: '500',
  },
});