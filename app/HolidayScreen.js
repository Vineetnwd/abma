import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

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
  holiday: '#8B4513',       // Saddle Brown for holidays
};

const HOLIDAY_ICONS = [
  'balloon',
  'gift',
  'star',
  'heart',
  'trophy',
  'flower',
  'sparkles',
  'sunny',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function HolidayListScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [groupedHolidays, setGroupedHolidays] = useState({});
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchHolidays();
  }, []);

  useEffect(() => {
    groupHolidaysByMonth();
  }, [holidays]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=holiday_list',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (result.status === 'success' && result.data && Array.isArray(result.data)) {
        const sortedHolidays = result.data.sort((a, b) => 
          new Date(a.holiday_date) - new Date(b.holiday_date)
        );
        setHolidays(sortedHolidays);
        
        await AsyncStorage.setItem('cached_holidays', JSON.stringify(sortedHolidays));
      } else {
        setError('No holidays found');
      }
    } catch (err) {
      console.error('Error fetching holidays:', err);
      setError('Failed to load holidays');
      
      try {
        const cachedHolidays = await AsyncStorage.getItem('cached_holidays');
        if (cachedHolidays) {
          setHolidays(JSON.parse(cachedHolidays));
          setError('Showing cached holidays. Network error occurred.');
        }
      } catch (cacheErr) {
        console.error('Cache error:', cacheErr);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHolidays();
  };

  const groupHolidaysByMonth = () => {
    const grouped = {};
    
    holidays.forEach(holiday => {
      const date = new Date(holiday.holiday_date);
      const monthYear = `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(holiday);
    });
    
    setGroupedHolidays(grouped);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
  };

  const getDayOfWeek = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const isUpcoming = (dateString) => {
    const holidayDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidayDate >= today;
  };

  const isPast = (dateString) => {
    const holidayDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidayDate < today;
  };

  const getDaysUntil = (dateString) => {
    const holidayDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = holidayDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUpcomingHolidays = () => {
    return holidays.filter(h => isUpcoming(h.holiday_date));
  };

  const getRandomIcon = (index) => {
    return HOLIDAY_ICONS[index % HOLIDAY_ICONS.length];
  };

  const getRandomColor = (index) => {
    const colors = [
      COLORS.success,
      COLORS.secondary,
      COLORS.warning,
      COLORS.combat,
      COLORS.darkAccent,
      COLORS.accent,
      COLORS.error,
      COLORS.primary
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="calendar" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.loadingText}>LOADING HOLIDAYS...</Text>
      </View>
    );
  }

  const upcomingCount = getUpcomingHolidays().length;

  return (
    <View style={styles.container}>
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
          <Text style={styles.headerTitle}>HOLIDAY LIST</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="calendar" size={28} color={COLORS.accent} />
            </View>
            <Text style={styles.statValue}>{holidays.length}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="time" size={28} color={COLORS.accent} />
            </View>
            <Text style={styles.statValue}>{upcomingCount}</Text>
            <Text style={styles.statLabel}>UPCOMING</Text>
          </View>
        </View>

        {/* Year Badge */}
        <View style={styles.yearBadge}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
          <Text style={styles.yearText}>ACADEMIC YEAR {selectedYear}</Text>
        </View>
      </LinearGradient>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="information-circle" size={16} color={COLORS.error} />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Holiday List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[COLORS.secondary]}
            tintColor={COLORS.secondary}
          />
        }
      >
        {holidays.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={80} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>NO HOLIDAYS SCHEDULED</Text>
            <Text style={styles.emptySubText}>Check back later for updates</Text>
          </View>
        ) : (
          <>
            {/* Next Holiday Card */}
            {upcomingCount > 0 && (
              <View style={styles.nextHolidaySection}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="star" size={18} color={COLORS.accent} /> NEXT HOLIDAY
                </Text>
                <NextHolidayCard
                  holiday={getUpcomingHolidays()[0]}
                  formatDate={formatDate}
                  getDayOfWeek={getDayOfWeek}
                  getDaysUntil={getDaysUntil}
                  getRandomColor={getRandomColor}
                />
              </View>
            )}

            {/* Grouped Holidays */}
            {Object.keys(groupedHolidays).map((monthYear, groupIndex) => (
              <View key={monthYear} style={styles.monthSection}>
                <View style={styles.monthHeader}>
                  <Ionicons name="calendar" size={20} color={COLORS.accent} />
                  <Text style={styles.monthTitle}>{monthYear.toUpperCase()}</Text>
                  <View style={styles.monthBadge}>
                    <Text style={styles.monthBadgeText}>
                      {groupedHolidays[monthYear].length}
                    </Text>
                  </View>
                </View>

                {groupedHolidays[monthYear].map((holiday, index) => (
                  <HolidayCard
                    key={holiday.id}
                    holiday={holiday}
                    index={groupIndex * 10 + index}
                    formatDate={formatDate}
                    getDayOfWeek={getDayOfWeek}
                    isUpcoming={isUpcoming(holiday.holiday_date)}
                    isPast={isPast(holiday.holiday_date)}
                    getDaysUntil={getDaysUntil}
                    getRandomIcon={getRandomIcon}
                    getRandomColor={getRandomColor}
                  />
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function NextHolidayCard({ holiday, formatDate, getDayOfWeek, getDaysUntil }) {
  const daysUntil = getDaysUntil(holiday.holiday_date);
  
  return (
    <View style={styles.nextHolidayCard}>
      <LinearGradient
        colors={[COLORS.warning, COLORS.accent]}
        style={styles.nextHolidayGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.nextHolidayIcon}>
          <Ionicons name="star" size={32} color={COLORS.primary} />
        </View>
        <View style={styles.nextHolidayContent}>
          <Text style={styles.nextHolidayName}>{holiday.holiday_name}</Text>
          <Text style={styles.nextHolidayDate}>
            {getDayOfWeek(holiday.holiday_date)}, {formatDate(holiday.holiday_date)}
          </Text>
          <View style={styles.nextHolidayCountdown}>
            <Ionicons name="time-outline" size={16} color={COLORS.primary} />
            <Text style={styles.nextHolidayCountdownText}>
              {daysUntil === 0 ? 'TODAY!' : daysUntil === 1 ? 'TOMORROW!' : `IN ${daysUntil} DAYS`}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function HolidayCard({ 
  holiday, 
  index, 
  formatDate, 
  getDayOfWeek, 
  isUpcoming, 
  isPast, 
  getDaysUntil,
  getRandomIcon, 
  getRandomColor 
}) {
  const color = getRandomColor(index);
  const icon = getRandomIcon(index);
  const daysUntil = getDaysUntil(holiday.holiday_date);

  return (
    <View style={[styles.holidayCard, isPast && styles.holidayCardPast]}>
      <View style={[styles.holidayIconContainer, { backgroundColor: color + '20', borderColor: color + '40' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>

      <View style={styles.holidayContent}>
        <Text style={[styles.holidayName, isPast && styles.holidayNamePast]}>
          {holiday.holiday_name}
        </Text>
        <View style={styles.holidayDateRow}>
          <Ionicons 
            name="calendar-outline" 
            size={14} 
            color={isPast ? COLORS.gray : COLORS.accent} 
          />
          <Text style={[styles.holidayDate, isPast && styles.holidayDatePast]}>
            {getDayOfWeek(holiday.holiday_date)}
          </Text>
        </View>
        <Text style={[styles.holidayDateFull, isPast && styles.holidayDatePast]}>
          {formatDate(holiday.holiday_date)}
        </Text>
      </View>

      {isUpcoming && (
        <View style={styles.holidayBadge}>
          {daysUntil === 0 ? (
            <View style={[styles.todayBadge, { backgroundColor: color }]}>
              <Text style={styles.todayBadgeText}>TODAY</Text>
            </View>
          ) : daysUntil === 1 ? (
            <View style={[styles.tomorrowBadge, { backgroundColor: color }]}>
              <Text style={styles.tomorrowBadgeText}>TOMORROW</Text>
            </View>
          ) : daysUntil <= 7 ? (
            <View style={[styles.soonBadge, { borderColor: color }]}>
              <Text style={[styles.soonBadgeText, { color: color }]}>
                {daysUntil}D
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {isPast && (
        <View style={styles.pastBadge}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.gray} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
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
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(193, 154, 107, 0.15)',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(193, 154, 107, 0.3)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.accent,
    opacity: 0.95,
    marginTop: 4,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  yearText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4E4D7',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 10,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray,
    marginTop: 20,
    letterSpacing: 1,
  },
  emptySubText: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 8,
    fontWeight: '500',
  },
  nextHolidaySection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
    letterSpacing: 1,
  },
  nextHolidayCard: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  nextHolidayGradient: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  nextHolidayIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  nextHolidayContent: {
    flex: 1,
    justifyContent: 'center',
  },
  nextHolidayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  nextHolidayDate: {
    fontSize: 14,
    color: COLORS.primary,
    opacity: 0.95,
    marginBottom: 8,
    fontWeight: '600',
  },
  nextHolidayCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(44, 62, 35, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  nextHolidayCountdownText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  monthSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent + '40',
  },
  monthTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  monthBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  holidayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
    borderLeftWidth: 4,
  },
  holidayCardPast: {
    opacity: 0.6,
  },
  holidayIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
  },
  holidayContent: {
    flex: 1,
  },
  holidayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  holidayNamePast: {
    color: COLORS.gray,
  },
  holidayDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  holidayDate: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '700',
  },
  holidayDatePast: {
    color: COLORS.gray,
  },
  holidayDateFull: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
  },
  holidayBadge: {
    marginLeft: 10,
  },
  todayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.8,
  },
  tomorrowBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tomorrowBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.8,
  },
  soonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
  },
  soonBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  pastBadge: {
    marginLeft: 10,
  },
});
