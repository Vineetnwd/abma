import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  success: '#5D7C2F',        // Military green
  warning: '#C87533',        // Burnt orange
  background: '#F5F3EE',     // Off-white/Beige
  cardBg: '#FAFAF7',        // Light beige
  textPrimary: '#2C2C2C',    // Dark gray
  textSecondary: '#5C5C5C',  // Medium gray
};

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { phoneNumber, studentCount } = params;

  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Rotating animation for lock icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    inputRefs[0].current?.focus();
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (newOtp.every((digit) => digit !== '')) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const storeStudentData = async (studentData) => {
    try {
      await AsyncStorage.setItem('student_id', studentData.id);
      await AsyncStorage.setItem('student_admission', studentData.student_admission);
      await AsyncStorage.setItem('student_name', studentData.student_name);
      await AsyncStorage.setItem('student_class', studentData.student_class);
      await AsyncStorage.setItem('student_section', studentData.student_section);
      await AsyncStorage.setItem('student_mobile', studentData.student_mobile);
      await AsyncStorage.setItem('student_photo', studentData.student_photo);
      await AsyncStorage.setItem('isLoggedIn', 'true');
    } catch (error) {
      console.error('Error storing student data:', error);
    }
  };

  const verifyOTP = async (otpValue) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=get_otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_mobile: phoneNumber,
            otp: otpValue,
          }),
        }
      );

      const result = await response.json();

      if (result.status === 'success') {
        const { count, data, notices } = result;
        await AsyncStorage.setItem('all_students', JSON.stringify(data));
        if (count > 1) {
          router.push({
            pathname: '/student-selection',
            params: {
              students: JSON.stringify(data),
              notices: JSON.stringify(notices || []),
            },
          });
        } else if (count === 1) {
          const studentData = data[0];
          await storeStudentData(studentData);

          router.replace({
            pathname: '/student_home',
            params: {
              studentData: JSON.stringify(studentData),
              notices: JSON.stringify(notices || []),
            },
          });
        } else {
          setError('No student found');
          setOtp(['', '', '', '']);
          inputRefs[0].current?.focus();
          shakeAnimation();
        }
      } else {
        setError(result.msg || 'Invalid OTP');
        setOtp(['', '', '', '']);
        inputRefs[0].current?.focus();
        shakeAnimation();
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('OTP Verification Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '']);
    setError('');

    try {
      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=send_otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_mobile: phoneNumber,
          }),
        }
      );

      const result = await response.json();
      
      if (result.status === 'success') {
        console.log('OTP resent successfully');
      }
    } catch (err) {
      console.error('Resend OTP Error:', err);
      setError('Failed to resend OTP. Please try again.');
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={[COLORS.dark, COLORS.primary, COLORS.secondary]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Tactical Grid Background */}
      <View style={styles.gridOverlay}>
        <View style={styles.gridLineHorizontal} />
        <View style={[styles.gridLineHorizontal, { top: '33%' }]} />
        <View style={[styles.gridLineHorizontal, { top: '66%' }]} />
        <View style={styles.gridLineVertical} />
        <View style={[styles.gridLineVertical, { left: '33%' }]} />
        <View style={[styles.gridLineVertical, { left: '66%' }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              {/* Tactical frame */}
              <View style={styles.tacticalFrame}>
                <View style={styles.cornerMark1} />
                <View style={styles.cornerMark2} />
                <View style={styles.cornerMark3} />
                <View style={styles.cornerMark4} />
              </View>
              
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="shield-checkmark" size={50} color={COLORS.accent} />
              </Animated.View>
              
              {/* Security badge */}
              <View style={styles.securityBadge}>
                <View style={styles.securityDot} />
              </View>
            </View>
            
            <View style={styles.titleContainer}>
              <Text style={styles.title}>VERIFY OTP</Text>
              <View style={styles.titleUnderline} />
            </View>
            
            <Text style={styles.subtitle}>
              Enter the 4-digit code sent to{'\n'}
              <Text style={styles.phoneText}>+91 {phoneNumber}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <Animated.View
            style={[
              styles.otpContainer,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            {otp.map((digit, index) => (
              <View key={index} style={styles.otpInputWrapper}>
                <TextInput
                  ref={inputRefs[index]}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                    error && styles.otpInputError,
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  selectTextOnFocus
                  editable={!loading}
                />
                {digit && (
                  <View style={styles.inputCheckmark}>
                    <Ionicons name="checkmark" size={12} color={COLORS.success} />
                  </View>
                )}
              </View>
            ))}
          </Animated.View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="alert-circle" size={20} color={COLORS.error} />
              </View>
              <View style={styles.errorTextContainer}>
                <Text style={styles.errorTitle}>VERIFICATION FAILED</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </View>
          ) : null}

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.loadingText}>VERIFYING CODE...</Text>
              <View style={styles.loadingBadge}>
                <Text style={styles.loadingBadgeText}>SECURE VERIFICATION</Text>
              </View>
            </View>
          )}

          {/* Resend OTP */}
          <View style={styles.resendContainer}>
            {!canResend ? (
              <View style={styles.timerContainer}>
                <Ionicons name="time-outline" size={18} color={COLORS.accent} />
                <Text style={styles.timerText}>
                  RESEND IN{' '}
                  <Text style={styles.timerHighlight}>{timer}S</Text>
                </Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.resendButton}
                onPress={handleResendOTP}
              >
                <LinearGradient
                  colors={[COLORS.accent, '#A89063']}
                  style={styles.resendButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.buttonStripe} />
                  <Ionicons name="refresh" size={18} color={COLORS.dark} />
                  <Text style={styles.resendText}>RESEND OTP</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Student Count Info */}
          {studentCount && parseInt(studentCount) > 1 && (
            <View style={styles.infoBox}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="people-outline" size={20} color={COLORS.accent} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>MULTIPLE STUDENTS</Text>
                <Text style={styles.infoText}>
                  {studentCount} students registered with this number
                </Text>
              </View>
            </View>
          )}

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <View style={styles.helpIconContainer}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.accent} />
            </View>
            <Text style={styles.helpText}>
              OTP VALID FOR 10 MINUTES
            </Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.03,
  },
  gridLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: COLORS.white,
    top: 0,
  },
  gridLineVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: COLORS.white,
    left: 0,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    borderColor: COLORS.accent,
    position: 'relative',
  },
  tacticalFrame: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  cornerMark1: {
    position: 'absolute',
    width: 15,
    height: 3,
    backgroundColor: COLORS.dark,
    top: 5,
    left: 15,
  },
  cornerMark2: {
    position: 'absolute',
    width: 15,
    height: 3,
    backgroundColor: COLORS.dark,
    top: 5,
    right: 15,
  },
  cornerMark3: {
    position: 'absolute',
    width: 15,
    height: 3,
    backgroundColor: COLORS.dark,
    bottom: 5,
    left: 15,
  },
  cornerMark4: {
    position: 'absolute',
    width: 15,
    height: 3,
    backgroundColor: COLORS.dark,
    bottom: 5,
    right: 15,
  },
  securityBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  securityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  titleUnderline: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.accent,
    marginTop: 8,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.95,
    lineHeight: 22,
    fontWeight: '500',
  },
  phoneText: {
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  otpInputWrapper: {
    position: 'relative',
  },
  otpInput: {
    width: 70,
    height: 70,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.primary,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 3,
    borderColor: COLORS.lightGray,
  },
  otpInputFilled: {
    borderColor: COLORS.accent,
    backgroundColor: '#FFF8E1',
  },
  otpInputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFEBEE',
  },
  inputCheckmark: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success + '30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  errorIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.error + '40',
  },
  errorTextContainer: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 2,
    letterSpacing: 0.8,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 14,
    marginTop: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  loadingBadge: {
    marginTop: 8,
    backgroundColor: COLORS.accent + '40',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.accent + '60',
  },
  loadingBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  timerText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  timerHighlight: {
    fontWeight: 'bold',
    color: COLORS.accent,
    fontSize: 16,
  },
  resendButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  resendButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  buttonStripe: {
    width: 3,
    height: 20,
    backgroundColor: 'rgba(44, 62, 31, 0.5)',
    borderRadius: 2,
  },
  resendText: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 115, 85, 0.25)',
    padding: 15,
    borderRadius: 12,
    marginTop: 30,
    borderWidth: 2,
    borderColor: COLORS.accent + '60',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent + '35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.accent + '50',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 3,
    letterSpacing: 1,
  },
  infoText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '500',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  helpIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});