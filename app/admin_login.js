import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#2D3A2E',
  secondary: '#4A5D23',
  tertiary: '#556B2F',
  accent: '#D4AF37',
  accentLight: '#E8C468',
  white: '#FFFFFF',
  offWhite: '#F5F5DC',
  gray: '#6B7280',
  lightGray: '#D1D5DB',
  darkGray: '#374151',
  error: '#DC2626',
  success: '#16A34A',
  background: '#E8E6E0',
  camouflage: '#78866B',
  sand: '#C3B091',
  combat: '#1F2937',
};

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState('');
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  // Refs for TextInputs
  const usernameInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    checkLoginStatus();

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

    // Floating animations
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

  const checkLoginStatus = async () => {
    try {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      if (isLoggedIn === 'true') {
        router.replace('/Dashboard');
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const storeUserData = async (userData) => {
    try {
      await AsyncStorage.setItem('user_id', userData.id);
      await AsyncStorage.setItem('full_name', userData.full_name);
      await AsyncStorage.setItem('user_type', userData.user_type);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      console.log('User data stored successfully');
      return true;
    } catch (error) {
      console.error('Error storing user data:', error);
      return false;
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'https://abma.org.in/binex/api.php?task=login',
        {
          user_name: username,
          user_pass: password
        }
      );

      if (response.data.status === 'success' && response.data.count > 0) {
        const userData = response.data.data[0];
        const stored = await storeUserData(userData);
        
        if (stored) {
          router.replace('/Dashboard');
        } else {
          setError('Failed to store login information. Please try again.');
        }
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        'Network error. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
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

  if (isCheckingAuth) {
    return (
      <LinearGradient
        colors={[COLORS.combat, COLORS.primary, COLORS.secondary]}
        style={[styles.container, styles.centerContent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaProvider>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <LinearGradient
          colors={[COLORS.combat, COLORS.primary, COLORS.secondary]}
          style={styles.container}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <StatusBar style="light" />
          
          {/* Camouflage Pattern Overlay */}
          <View style={styles.camouflageOverlay} pointerEvents="none">
            <View style={styles.camoPattern1} />
            <View style={styles.camoPattern2} />
            <View style={styles.camoPattern3} />
          </View>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Decorative Background Elements */}
              <Animated.View
                style={[
                  styles.decorativeCircle1,
                  { transform: [{ translateY: float1Translate }] },
                ]}
                pointerEvents="none"
              />
              <Animated.View
                style={[
                  styles.decorativeCircle2,
                  { transform: [{ translateY: float2Translate }] },
                ]}
                pointerEvents="none"
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
                  <View style={styles.logoRing1} pointerEvents="none" />
                  <View style={styles.logoRing2} pointerEvents="none" />
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
                        <Text style={styles.welcomeText}>ADMIN PORTAL</Text>
                        <Text style={styles.welcomeSubtext}>Secure Access</Text>
                      </View>
                    </LinearGradient>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.securityBanner}>
                      <View style={styles.securityStripe} />
                      <Text style={styles.instructionText}>
                        AUTHORIZED PERSONNEL ONLY
                      </Text>
                      <View style={styles.securityStripe} />
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

                    {/* Username Input */}
                    <View style={styles.inputWrapper}>
                      <View style={styles.labelContainer}>
                        <View style={styles.labelBadge} />
                        <Text style={styles.inputLabel}>USERNAME</Text>
                      </View>
                      <View
                        style={[
                          styles.inputContainer,
                          error ? styles.inputContainerError : null,
                          passwordFocused ? { borderColor: COLORS.accent } : null
                        ]}


                      >
                        <View style={styles.iconWrapper}>
                          <Ionicons
                            name="person-circle"
                            size={22}
                            color={usernameFocused ? COLORS.accent : COLORS.gray}
                          />
                        </View>
                        <View style={styles.inputDivider} />
                        <TextInput
                          ref={usernameInputRef}
                          style={styles.input}
                          placeholder="Enter admin username"
                          placeholderTextColor={COLORS.gray}
                          value={username}
                          onChangeText={(text) => {
                            setUsername(text);
                            setError('');
                          }}
                          onFocus={() => setUsernameFocused(true)}
                          onBlur={() => setUsernameFocused(false)}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => passwordInputRef.current?.focus()}
                          editable={!isLoading}
                        />
                        {username.length > 0 && !error && (
                          <View style={styles.checkmarkBadge}>
                            <Ionicons
                              name="checkmark-circle"
                              size={22}
                              color={COLORS.success}
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputWrapper}>
                      <View style={styles.labelContainer}>
                        <View style={styles.labelBadge} />
                        <Text style={styles.inputLabel}>PASSWORD</Text>
                      </View>
                      <View
                        style={[
                          styles.inputContainer,
                          error ? styles.inputContainerError : null,
                          passwordFocused ? { borderColor: COLORS.accent } : null,
                        ]}
                      >

                        <View style={styles.iconWrapper}>
                          <Ionicons
                            name="lock-closed"
                            size={22}
                            color={passwordFocused ? COLORS.accent : COLORS.gray}
                          />
                        </View>
                        <View style={styles.inputDivider} />
                        <TextInput
                          ref={passwordInputRef}
                          style={styles.input}
                          placeholder="Enter admin password"
                          placeholderTextColor={COLORS.gray}
                          secureTextEntry={!showPassword}
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            setError('');
                          }}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={handleLogin}
                          editable={!isLoading}
                        />
                        <TouchableOpacity 
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeIcon}
                          activeOpacity={0.7}
                        >
                          <Ionicons 
                            name={showPassword ? "eye-off" : "eye"} 
                            size={22} 
                            color={COLORS.gray}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity 
                      style={[
                        styles.loginButton,
                        isLoading && styles.loginButtonDisabled,
                      ]}
                      onPress={handleLogin}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[COLORS.accent, COLORS.accentLight]}
                        style={styles.loginButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {isLoading ? (
                          <>
                            <ActivityIndicator color={COLORS.primary} size="small" />
                            <Text style={styles.loginButtonText}>AUTHENTICATING...</Text>
                          </>
                        ) : (
                          <>
                            <Ionicons
                              name="shield-checkmark"
                              size={22}
                              color={COLORS.primary}
                            />
                            <Text style={styles.loginButtonText}>SECURE LOGIN</Text>
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
                          256-bit Military Grade Encryption
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
                          Secure Authentication Protocol
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
                  icon="shield-checkmark"
                  text="Secure Access"
                  delay={400}
                />
                <FeatureItem
                  icon="analytics"
                  text="Full Control"
                  delay={500}
                />
                <FeatureItem
                  icon="people"
                  text="Manage Users"
                  delay={600}
                />
              </Animated.View>

              {/* Footer */}
              <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <TouchableOpacity
                  style={styles.studentLoginButton}
                  onPress={() => router.push('/Index')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="people-circle" size={20} color={COLORS.accent} />
                  <Text style={styles.footerText}>STUDENT / PARENT LOGIN</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.accent} />
                </TouchableOpacity>
                <Text style={styles.versionText}>ADMIN PORTAL v1.0.0</Text>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </TouchableWithoutFeedback>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '700',
    letterSpacing: 1,
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
  keyboardAvoidingView: {
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
    letterSpacing: 1.5,
    textAlign: 'center',
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
  inputWrapper: {
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.sand,
    paddingRight: 15,
  },
  inputContainerFocused: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainerError: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2',
  },
  iconWrapper: {
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  inputDivider: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.sand,
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
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  loginButtonText: {
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
  studentLoginButton: {
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