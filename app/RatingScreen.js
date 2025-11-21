import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
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
  border: '#D4CEBA',         // Khaki border
  borderLight: '#E5E1D3',    // Light khaki
  star: '#C87533',           // Burnt orange for stars
};

const RatingScreen = () => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
 
  const handleSubmit = async () => {
    const studentId = await AsyncStorage.getItem('student_id');
    
    // Validation
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    if (review.trim() === '') {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    setLoading(true);

    const payload = {
      student_id: studentId,
      rating: rating.toString(),
      review: review,
      status: 'ACTIVE',
      created_by: studentId,
    };

    try {
      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=send_review',
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
        Alert.alert('Success', 'Review submitted successfully!', [
          {
            text: 'OK',
            onPress: () => {
              setRating(0);
              setReview('');
              router.back();
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to submit review. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <View style={[
            styles.starContainer,
            i <= rating && styles.starContainerActive
          ]}>
            <Ionicons
              name={i <= rating ? 'star' : 'star-outline'}
              size={36}
              color={i <= rating ? COLORS.accent : COLORS.lightGray}
            />
          </View>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const getRatingLabel = () => {
    switch(rating) {
      case 1: return 'POOR';
      case 2: return 'FAIR';
      case 3: return 'GOOD';
      case 4: return 'VERY GOOD';
      case 5: return 'EXCELLENT';
      default: return '';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.dark, COLORS.primary, COLORS.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerBadge}>
            <View style={styles.badgeStripe} />
            <Text style={styles.headerBadgeText}>ABMA</Text>
            <View style={styles.badgeDot} />
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>RATE YOUR EXPERIENCE</Text>
            <View style={styles.headerUnderline} />
          </View>
          <Text style={styles.headerSubtitle}>Your Feedback Matters</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Rating Section */}
        <View style={styles.card}>
          <View style={styles.cardHeaderContainer}>
            <View style={styles.cardDot} />
            <Text style={styles.label}>HOW WOULD YOU RATE US?</Text>
          </View>
          
          <View style={styles.starsContainer}>
            {renderStars()}
          </View>
          
          {rating > 0 && (
            <View style={styles.ratingInfoContainer}>
              <View style={styles.ratingBadge}>
                <View style={styles.ratingStripe} />
                <View style={styles.ratingContent}>
                  <Text style={styles.ratingNumber}>{rating}</Text>
                  <Text style={styles.ratingText}>
                    {rating === 1 ? 'STAR' : 'STARS'}
                  </Text>
                </View>
                <View style={styles.ratingIconContainer}>
                  <Ionicons name="star" size={20} color={COLORS.accent} />
                </View>
              </View>
              <View style={styles.ratingLabelBadge}>
                <Text style={styles.ratingLabel}>{getRatingLabel()}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Review Section */}
        <View style={styles.card}>
          <View style={styles.cardHeaderContainer}>
            <View style={styles.cardDot} />
            <Text style={styles.label}>WRITE YOUR REVIEW</Text>
          </View>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Share your thoughts about ABMA..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={6}
              value={review}
              onChangeText={setReview}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.charCountContainer}>
            <View style={styles.charCountDot} />
            <Text style={styles.charCount}>{review.length} CHARACTERS</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            loading && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={[COLORS.accent, '#A89063']}
            style={styles.submitButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.white} />
                <Text style={styles.loadingText}>SUBMITTING...</Text>
              </View>
            ) : (
              <>
                <View style={styles.buttonStripe} />
                <Text style={styles.submitButtonText}>SUBMIT REVIEW</Text>
                <View style={styles.buttonArrow}>
                  <Ionicons name="paper-plane" size={18} color={COLORS.dark} />
                </View>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Footer */}
        <View style={styles.footer}>
          <View style={styles.footerIconContainer}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerTitle}>FEEDBACK IMPORTANCE</Text>
            <Text style={styles.footerText}>
              Your feedback helps us improve our services
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeStripe: {
    width: 3,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
  },
  headerBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerTitleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  headerUnderline: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.accent,
    marginTop: 6,
    borderRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.95,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  cardHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  starContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  starContainerActive: {
    backgroundColor: COLORS.accent + '20',
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.3,
    elevation: 4,
  },
  ratingInfoContainer: {
    alignItems: 'center',
    marginTop: 15,
    gap: 10,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 12,
    borderWidth: 2,
    borderColor: COLORS.accent + '40',
    position: 'relative',
  },
  ratingStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  ratingContent: {
    alignItems: 'center',
    gap: 2,
  },
  ratingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.accent,
    letterSpacing: 0.5,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  ratingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent + '50',
  },
  ratingLabelBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  ratingLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 1.2,
  },
  textInputContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  textInput: {
    padding: 15,
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 140,
    fontWeight: '500',
  },
  charCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 6,
  },
  charCountDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.textSecondary,
  },
  charCount: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  submitButtonText: {
    color: COLORS.dark,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  buttonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(44, 62, 31, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  footerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  footerTextContainer: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 3,
    letterSpacing: 0.8,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default RatingScreen;