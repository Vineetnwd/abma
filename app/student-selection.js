import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const COLORS = {
  primary: '#556B2F',        // Dark Olive Green
  secondary: '#6B8E23',      // Olive Drab (Bright)
  accent: '#FF6B35',         // Military Signal Orange
  white: '#FFFFFF',
  gray: '#5D5D5D',
  lightGray: '#D4D4D4',
  background: '#F0EDE5',     // Sandy/Khaki background
  camoGreen: '#7CB342',      // Bright Camo Green
  militaryYellow: '#FFB300', // Military Yellow
  combatBrown: '#8D6E63',    // Combat Brown
};

export default function StudentSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [students, setStudents] = useState([]);
  const [notices, setNotices] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Parse students
    if (params.students) {
      try {
        const studentsData = JSON.parse(params.students);
        setStudents(studentsData);
        console.log('Students loaded:', studentsData.length);
      } catch (e) {
        console.error('Error parsing students:', e);
      }
    }

    // Parse notices
    if (params.notices) {
      try {
        const noticesData = JSON.parse(params.notices);
        setNotices(noticesData);
        console.log('Notices loaded:', noticesData.length);
      } catch (e) {
        console.error('Error parsing notices:', e);
      }
    }

    // Start animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleStudentSelect = async (student) => {
    try {
      // Store all student data in AsyncStorage
      await AsyncStorage.setItem('student_id', student.id);
      await AsyncStorage.setItem('student_admission', student.student_admission);
      await AsyncStorage.setItem('student_name', student.student_name);
      await AsyncStorage.setItem('student_class', student.student_class);
      await AsyncStorage.setItem('student_section', student.student_section);
      await AsyncStorage.setItem('student_roll', student.student_roll);
      await AsyncStorage.setItem('student_type', student.student_type);
      await AsyncStorage.setItem('student_photo', student.student_photo);
      await AsyncStorage.setItem('student_sex', student.student_sex);
      await AsyncStorage.setItem('student_mobile', student.student_mobile);
      await AsyncStorage.setItem('total_paid', student.total_paid);
      await AsyncStorage.setItem('current_dues', student.current_dues);
      await AsyncStorage.setItem('student_data', JSON.stringify(student));
      await AsyncStorage.setItem('isLoggedIn', 'true');

      // Store notices
      if (notices && notices.length > 0) {
        await AsyncStorage.setItem('notices', JSON.stringify(notices));
        console.log('Notices stored in AsyncStorage');
      }

      console.log('Student selected:', student.student_name);

      // Navigate to home with student data and notices
      router.replace({
        pathname: '/student_home',
        params: {
          studentData: JSON.stringify(student),
          notices: JSON.stringify(notices),
        },
      });
    } catch (error) {
      console.error('Error storing student data:', error);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary, COLORS.camoGreen]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="shield-checkmark" size={40} color={COLORS.militaryYellow} />
          </View>
          <Text style={styles.title}>Select Unit Member</Text>
          <Text style={styles.subtitle}>
            {students.length} soldier{students.length > 1 ? 's' : ''} registered on this number
          </Text>
          {notices.length > 0 && (
            <View style={styles.noticesBadge}>
              <Ionicons name="megaphone" size={14} color={COLORS.militaryYellow} />
              <Text style={styles.noticesBadgeText}>
                {notices.length} new alert{notices.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Students List */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {students.map((student, index) => (
            <Animated.View
              key={student.id}
              style={[
                styles.studentCard,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50 * (index + 1), 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleStudentSelect(student)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[COLORS.white, '#F5F5F5']}
                  style={styles.cardGradient}
                >
                  <View style={styles.studentInfo}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                      {student.student_photo !== 'no_image.jpg' ? (
                        <Image
                          source={{
                            uri: `https://abma.org.in/binex/upload/${student.student_photo}`,
                          }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.avatarPlaceholder,
                            {
                              backgroundColor:
                                student.student_sex === 'MALE'
                                  ? '#E8F5E9'
                                  : '#FFF3E0',
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              student.student_sex === 'MALE' ? 'male' : 'female'
                            }
                            size={40}
                            color={
                              student.student_sex === 'MALE'
                                ? COLORS.primary
                                : COLORS.accent
                            }
                          />
                        </View>
                      )}
                      <View style={styles.badge}>
                        <Ionicons name="star" size={10} color={COLORS.primary} />
                        <Text style={styles.badgeText}>
                          {student.student_class}
                        </Text>
                      </View>
                    </View>

                    {/* Details */}
                    <View style={styles.details}>
                      <Text style={styles.studentName}>
                        {student.student_name}
                      </Text>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="shield"
                          size={14}
                          color={COLORS.accent}
                        />
                        <Text style={styles.detailText}>
                          Unit {student.student_class} - Division{' '}
                          {student.student_section}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="id-card"
                          size={14}
                          color={COLORS.accent}
                        />
                        <Text style={styles.detailText}>
                          ID: {student.student_roll} | Reg: {student.student_admission}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="flag"
                          size={14}
                          color={COLORS.accent}
                        />
                        <Text style={styles.detailText}>
                          {student.student_type}
                        </Text>
                      </View>
                      
                      {/* Payment Info */}
                      <View style={styles.paymentInfo}>
                        <View style={styles.paymentItem}>
                          <Ionicons name="checkmark-circle" size={16} color={COLORS.camoGreen} />
                          <View style={styles.paymentTextContainer}>
                            <Text style={styles.paymentLabel}>Paid</Text>
                            <Text style={styles.paymentValuePaid}>₹{student.total_paid}</Text>
                          </View>
                        </View>
                        <View style={styles.paymentDivider} />
                        <View style={styles.paymentItem}>
                          <Ionicons name="alert-circle" size={16} color="#DC3545" />
                          <View style={styles.paymentTextContainer}>
                            <Text style={styles.paymentLabel}>Due</Text>
                            <Text style={styles.paymentValueDue}>₹{student.current_dues}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Arrow */}
                    <View style={styles.arrowContainer}>
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={COLORS.accent}
                      />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 179, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'rgba(255, 179, 0, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.white,
    opacity: 0.95,
    fontWeight: '600',
  },
  noticesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.5)',
  },
  noticesBadgeText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  studentCard: {
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  cardGradient: {
    padding: 15,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: COLORS.militaryYellow,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.militaryYellow,
  },
  badge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: COLORS.militaryYellow,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  details: {
    flex: 1,
  },
  studentName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 6,
    fontWeight: '600',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  paymentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentTextContainer: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  paymentValuePaid: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.camoGreen,
  },
  paymentValueDue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC3545',
  },
  paymentDivider: {
    width: 2,
    height: 35,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 10,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
});