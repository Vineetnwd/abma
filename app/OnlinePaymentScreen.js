import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
  background: '#F5F3EE',     // Off-white/Beige
  cardBg: '#FAFAF7',        // Light beige
  success: '#5D7C2F',        // Military green
  warning: '#C87533',        // Burnt orange
  textPrimary: '#2C2C2C',    // Dark gray
  textSecondary: '#5C5C5C',  // Medium gray
  border: '#D4CEBA',         // Khaki border
};

export default function OnlinePaymentScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation animation for icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Border animation
    Animated.loop(
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.dark, COLORS.primary, COLORS.secondary]}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Tactical Grid Background */}
          <View style={styles.gridOverlay}>
            <View style={styles.gridLineHorizontal} />
            <View style={[styles.gridLineHorizontal, { top: '25%' }]} />
            <View style={[styles.gridLineHorizontal, { top: '50%' }]} />
            <View style={[styles.gridLineHorizontal, { top: '75%' }]} />
            <View style={styles.gridLineVertical} />
            <View style={[styles.gridLineVertical, { left: '25%' }]} />
            <View style={[styles.gridLineVertical, { left: '50%' }]} />
            <View style={[styles.gridLineVertical, { left: '75%' }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>ONLINE PAYMENT</Text>
              <View style={styles.headerUnderline} />
            </View>
            <View style={styles.backButton} />
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Animated Icon Container */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                {/* Tactical Frame */}
                <View style={styles.tacticalFrame}>
                  <View style={styles.cornerMark1} />
                  <View style={styles.cornerMark2} />
                  <View style={styles.cornerMark3} />
                  <View style={styles.cornerMark4} />
                </View>

                <View style={styles.iconCircle}>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons name="card-outline" size={80} color={COLORS.accent} />
                  </Animated.View>
                  
                  {/* Crosshair */}
                  <View style={styles.crosshair}>
                    <View style={styles.crosshairHorizontal} />
                    <View style={styles.crosshairVertical} />
                  </View>
                </View>

                {/* Decorative circles */}
                <View style={[styles.decorativeCircle, styles.circle1]} />
                <View style={[styles.decorativeCircle, styles.circle2]} />
                <View style={[styles.decorativeCircle, styles.circle3]} />
              </Animated.View>

              {/* Coming Soon Badge */}
              <View style={styles.badge}>
                <LinearGradient
                  colors={[COLORS.accent, '#A89063']}
                  style={styles.badgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.badgeStripe} />
                  <Ionicons name="time-outline" size={16} color={COLORS.dark} />
                  <Text style={styles.badgeText}>COMING SOON</Text>
                  <View style={styles.badgeDot} />
                </LinearGradient>
              </View>

              {/* Title */}
              <View style={styles.titleContainer}>
                <Text style={styles.title}>SECURE PAYMENT</Text>
                <View style={styles.titleUnderline} />
              </View>

              {/* Description */}
              <Text style={styles.description}>
                Deploying secure and convenient online payment infrastructure.
              </Text>

              {/* Feature List */}
              <View style={styles.featureList}>
                <FeatureItem
                  icon="shield-checkmark"
                  text="Secure Payment Gateway"
                  delay={0}
                />
                <FeatureItem
                  icon="flash"
                  text="Quick & Easy Transactions"
                  delay={100}
                />
                <FeatureItem
                  icon="card"
                  text="Multiple Payment Options"
                  delay={200}
                />
                <FeatureItem
                  icon="receipt"
                  text="Instant Payment Receipt"
                  delay={300}
                />
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <View style={styles.infoIconContainer}>
                  <Ionicons
                    name="information-circle-outline"
                    size={24}
                    color={COLORS.accent}
                  />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>DEPLOYMENT IN PROGRESS</Text>
                  <Text style={styles.infoText}>
                    Feature activation imminent. Standby for notification!
                  </Text>
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Bottom Action */}
          <View style={styles.bottomAction}>
            <TouchableOpacity
              style={styles.notifyButton}
              activeOpacity={0.8}
              onPress={() => {
                alert('You will be notified when this feature is available!');
              }}
            >
              <LinearGradient
                colors={[COLORS.accent, '#A89063']}
                style={styles.notifyButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.buttonStripe} />
                <Ionicons name="notifications" size={20} color={COLORS.dark} />
                <Text style={styles.notifyButtonText}>NOTIFY ME</Text>
                <View style={styles.buttonArrow}>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.dark} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaProvider>
  );
}

function FeatureItem({ icon, text, delay }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.featureItem,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={20} color={COLORS.accent} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
      <View style={styles.featureArrow}>
        <View style={styles.featureDot} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  headerUnderline: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 20,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 30,
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tacticalFrame: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  cornerMark1: {
    position: 'absolute',
    width: 20,
    height: 3,
    backgroundColor: COLORS.accent,
    top: 0,
    left: 20,
  },
  cornerMark2: {
    position: 'absolute',
    width: 20,
    height: 3,
    backgroundColor: COLORS.accent,
    top: 0,
    right: 20,
  },
  cornerMark3: {
    position: 'absolute',
    width: 20,
    height: 3,
    backgroundColor: COLORS.accent,
    bottom: 0,
    left: 20,
  },
  cornerMark4: {
    position: 'absolute',
    width: 20,
    height: 3,
    backgroundColor: COLORS.accent,
    bottom: 0,
    right: 20,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.accent + '50',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  crosshair: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: COLORS.accent + '30',
    top: '50%',
  },
  crosshairVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: COLORS.accent + '30',
    left: '50%',
  },
  decorativeCircle: {
    position: 'absolute',
    backgroundColor: COLORS.accent + '30',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.accent + '40',
  },
  circle1: {
    width: 40,
    height: 40,
    top: -10,
    right: 10,
  },
  circle2: {
    width: 30,
    height: 30,
    bottom: 20,
    left: -10,
  },
  circle3: {
    width: 25,
    height: 25,
    top: 30,
    left: -15,
  },
  badge: {
    marginBottom: 20,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  badgeStripe: {
    width: 3,
    height: 20,
    backgroundColor: 'rgba(44, 62, 31, 0.5)',
    borderRadius: 2,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.dark,
    letterSpacing: 1.5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.dark,
    opacity: 0.6,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
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
  description: {
    fontSize: 15,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.95,
    lineHeight: 24,
    marginBottom: 30,
    fontWeight: '500',
  },
  featureList: {
    width: '100%',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIconContainer: {
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
  featureText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.5,
  },
  featureArrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 115, 85, 0.25)',
    borderRadius: 15,
    padding: 15,
    gap: 12,
    borderWidth: 2,
    borderColor: COLORS.accent + '60',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    marginBottom: 20,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent + '35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent + '50',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 4,
    letterSpacing: 1,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.white,
    lineHeight: 20,
    opacity: 0.95,
    fontWeight: '500',
  },
  bottomAction: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 20,
  },
  notifyButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  notifyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buttonStripe: {
    width: 3,
    height: 24,
    backgroundColor: 'rgba(44, 62, 31, 0.5)',
    borderRadius: 2,
    marginRight: 5,
  },
  notifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    letterSpacing: 1.5,
  },
  buttonArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(44, 62, 31, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
});