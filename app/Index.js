import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

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

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo subtle rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animations for decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim1, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim1, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim2, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim2, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSendOTP = async () => {
    setError('');

    if (!validatePhone(phoneNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

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

      const data = await response.json();

      if (data.status === 'success') {
        router.push({
          pathname: '/otp',
          params: {
            phoneNumber: phoneNumber,
            studentCount: data.count.toString(),
          },
        });
      } else {
        setError(data.msg || 'No student found with this mobile number');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  const float1Translate = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const float2Translate = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <SafeAreaProvider>
      <LinearGradient
        colors={[COLORS.combat, COLORS.primary, COLORS.secondary]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Camouflage Pattern Overlay */}
        <View style={styles.camouflageOverlay}>
          <View style={styles.camoPattern1} />
          <View style={styles.camoPattern2} />
          <View style={styles.camoPattern3} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Decorative Background Elements */}
            <Animated.View
              style={[
                styles.decorativeCircle1,
                { transform: [{ translateY: float1Translate }] },
              ]}
            />
            <Animated.View
              style={[
                styles.decorativeCircle2,
                { transform: [{ translateY: float2Translate }] },
              ]}
            />

            {/* Logo Section */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    { scale: logoScale },
                    { rotate: logoRotateInterpolate },
                  ],
                },
              ]}
            >
              <View style={styles.logoWrapper}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require('./assets/logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                {/* Decorative rings around logo */}
                <View style={styles.logoRing1} />
                <View style={styles.logoRing2} />
              </View>
              <Text style={styles.schoolName}>ANNIE BEASENT</Text>
              <Text style={styles.tagline}>MILITARY ACADEMY</Text>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Ionicons name="shield-checkmark" size={20} color={COLORS.accent} />
                <View style={styles.dividerLine} />
              </View>
            </Animated.View>

            {/* Login Form */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: cardScale }],
                },
              ]}
            >
              <View style={styles.formCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <LinearGradient
                    colors={[COLORS.secondary, COLORS.tertiary]}
                    style={styles.cardHeaderGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={styles.headerBadge}>
                      <Ionicons name="shield-checkmark" size={24} color={COLORS.accent} />
                    </View>
                    <View style={styles.headerTextContainer}>
                      <Text style={styles.welcomeText}>CADET ACCESS</Text>
                      <Text style={styles.welcomeSubtext}>Secure Entry Point</Text>
                    </View>
                  </LinearGradient>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.securityBanner}>
                    <View style={styles.securityStripe} />
                    <Text style={styles.instructionText}>
                      ENTER REGISTERED MOBILE NUMBER
                    </Text>
                    <View style={styles.securityStripe} />
                  </View>

                  {/* Phone Input with Country Code */}
                  <View style={styles.inputContainer}>
                    <View style={styles.labelContainer}>
                      <View style={styles.labelBadge} />
                      <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                    </View>
                    <View
                      style={[
                        styles.inputWrapper,
                        error ? styles.inputWrapperError : null,
                        isFocused ? { borderColor: COLORS.accent } : null,
                      ]}

                    >
                      <View style={styles.countryCode}>
                        <View style={styles.countryFlagContainer}>
                          <Text style={styles.countryFlag}>🇮🇳</Text>
                        </View>
                        <Text style={styles.countryCodeText}>+91</Text>
                      </View>
                      <View style={styles.inputDivider} />
                      <TextInput
                        style={styles.input}
                        placeholder="10-digit number"
                        placeholderTextColor={COLORS.gray}
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phoneNumber}
                        onChangeText={(text) => {
                          setPhoneNumber(text.replace(/[^0-9]/g, ''));
                          setError('');
                        }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                      />
                      {phoneNumber.length === 10 && !error && (
                        <View style={styles.checkmarkBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={COLORS.success}
                          />
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Error Message */}
                  {error ? (
                    <Animated.View
                      style={[
                        styles.errorContainer,
                        { opacity: fadeAnim },
                      ]}
                    >
                      <Ionicons name="warning" size={18} color={COLORS.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                  ) : null}

                  {/* Send OTP Button */}
                  <TouchableOpacity
                    style={[
                      styles.sendOtpButton,
                      loading && styles.sendOtpButtonDisabled,
                    ]}
                    onPress={handleSendOTP}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.accentLight]}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <>
                          <ActivityIndicator color={COLORS.primary} size="small" />
                          <Text style={styles.buttonText}>DISPATCHING CODE...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons
                            name="shield-checkmark"
                            size={22}
                            color={COLORS.primary}
                          />
                          <Text style={styles.buttonText}>REQUEST OTP</Text>
                          <Ionicons
                            name="arrow-forward"
                            size={20}
                            color={COLORS.primary}
                          />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Info Section */}
                  <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconWrapper}>
                        <Ionicons
                          name="shield-checkmark"
                          size={16}
                          color={COLORS.success}
                        />
                      </View>
                      <Text style={styles.infoText}>
                        Secure 4-Digit Verification Code
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <View style={styles.infoIconWrapper}>
                        <Ionicons
                          name="lock-closed"
                          size={16}
                          color={COLORS.success}
                        />
                      </View>
                      <Text style={styles.infoText}>
                        Encrypted Data Transmission
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Features Section */}
            <Animated.View
              style={[
                styles.featuresContainer,
                { opacity: fadeAnim },
              ]}
            >
              <FeatureItem
                icon="notifications"
                text="Instant Alerts"
                delay={400}
              />
              <FeatureItem
                icon="shield-checkmark"
                text="Secure Access"
                delay={500}
              />
              <FeatureItem
                icon="time"
                text="24/7 Support"
                delay={600}
              />
            </Animated.View>

            {/* Footer */}
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
              <TouchableOpacity
                style={styles.adminLoginButton}
                onPress={() => router.push('/admin_login')}
                activeOpacity={0.7}
              >
                <Ionicons name="shield-checkmark" size={20} color={COLORS.accent} />
                <Text style={styles.footerText}>ADMIN PORTAL</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.accent} />
              </TouchableOpacity>
              <Text style={styles.versionText}>SECURE ACCESS v1.0.0</Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaProvider>
  );
}

function FeatureItem({ icon, text, delay }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.featureItem, { opacity: fadeAnim }]}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={22} color={COLORS.accent} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camouflageOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.1,
  },
  camoPattern1: {
    position: 'absolute',
    width: 150,
    height: 150,
    backgroundColor: COLORS.camouflage,
    borderRadius: 75,
    top: 100,
    left: 20,
  },
  camoPattern2: {
    position: 'absolute',
    width: 200,
    height: 200,
    backgroundColor: COLORS.sand,
    borderRadius: 100,
    top: 300,
    right: -50,
  },
  camoPattern3: {
    position: 'absolute',
    width: 120,
    height: 120,
    backgroundColor: COLORS.secondary,
    borderRadius: 60,
    bottom: 150,
    left: -30,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    top: -50,
    right: -50,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(85, 107, 47, 0.1)',
    bottom: 100,
    left: -30,
    borderWidth: 2,
    borderColor: 'rgba(85, 107, 47, 0.2)',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 5,
    borderColor: COLORS.accent,
  },
  logoImage: {
    width: 110,
    height: 110,
  },
  logoRing1: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    top: -10,
    left: -10,
  },
  logoRing2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    top: -20,
    left: -20,
  },
  schoolName: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.accent,
    marginTop: 8,
    fontWeight: '800',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 10,
  },
  dividerLine: {
    width: 50,
    height: 3,
    backgroundColor: COLORS.accent,
  },
  formContainer: {
    marginBottom: 30,
  },
  formCard: {
    backgroundColor: COLORS.offWhite,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 15,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  cardHeader: {
    overflow: 'hidden',
  },
  cardHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  headerBadge: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
  },
  welcomeSubtext: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 2,
  },
  cardBody: {
    padding: 25,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    gap: 10,
  },
  securityStripe: {
    width: 30,
    height: 3,
    backgroundColor: COLORS.accent,
  },
  instructionText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.sand,
    paddingRight: 15,
  },
  inputWrapperFocused: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  inputWrapperError: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingVertical: 15,
    gap: 8,
  },
  countryFlagContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  inputDivider: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.sand,
    marginHorizontal: 5,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
    paddingHorizontal: 15,
  },
  checkmarkBadge: {
    marginRight: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    fontWeight: '600',
  },
  sendOtpButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  sendOtpButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  infoContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(74, 93, 35, 0.1)',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIconWrapper: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.primary,
    lineHeight: 16,
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIconContainer: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  featureText: {
    fontSize: 11,
    color: COLORS.accent,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  adminLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 58, 46, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  footerText: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '700',
    letterSpacing: 1,
  },
  versionText: {
    fontSize: 10,
    color: COLORS.sand,
    opacity: 0.7,
    fontWeight: '600',
    letterSpacing: 1,
  },
});