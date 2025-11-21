import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import RenderHtml from 'react-native-render-html';

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
};

export default function NoticeBoardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    filterNotices();
  }, [searchQuery, selectedFilter, notices]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError('');

      const studentId = await AsyncStorage.getItem('student_id');
      
      if (!studentId) {
        router.replace('/index');
        return;
      }

      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=get_notice',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ student_id: studentId }),
        }
      );

      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        // Sort by date (newest first)
        const sortedNotices = data.sort((a, b) => 
          new Date(b.notice_date) - new Date(a.notice_date)
        );
        setNotices(sortedNotices);
        setFilteredNotices(sortedNotices);
        
        // Cache notices
        await AsyncStorage.setItem('cached_notices', JSON.stringify(sortedNotices));
      } else {
        setError('No notices found');
      }
    } catch (err) {
      console.error('Error fetching notices:', err);
      setError('Failed to load notices');
      
      // Try to load cached notices
      try {
        const cachedNotices = await AsyncStorage.getItem('cached_notices');
        if (cachedNotices) {
          setNotices(JSON.parse(cachedNotices));
          setFilteredNotices(JSON.parse(cachedNotices));
          setError('Showing cached notices. Network error occurred.');
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
    fetchNotices();
  };

  const filterNotices = () => {
    let filtered = notices;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(notice =>
        notice.notice_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.notice_details.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply time filter
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (selectedFilter) {
      case 'week':
        filtered = filtered.filter(notice => 
          new Date(notice.notice_date) >= oneWeekAgo
        );
        break;
      case 'month':
        filtered = filtered.filter(notice => 
          new Date(notice.notice_date) >= oneMonthAgo
        );
        break;
      case 'all':
      default:
        break;
    }

    setFilteredNotices(filtered);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      const options = { day: '2-digit', month: 'short', year: 'numeric' };
      return date.toLocaleDateString('en-GB', options);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleAttachment = (url) => {
    if (url) {
      Linking.openURL(`https://abma.org.in/binex/uploads/${url}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="notifications" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.loadingText}>LOADING NOTICES...</Text>
        <View style={styles.loadingBadge}>
          <Text style={styles.loadingBadgeText}>TACTICAL LOADING</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.dark, COLORS.primary, COLORS.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>NOTICE BOARD</Text>
            <View style={styles.headerUnderline} />
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="documents-outline" size={24} color={COLORS.accent} />
            <Text style={styles.statValue}>{notices.length}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={24} color={COLORS.accent} />
            <Text style={styles.statValue}>
              {notices.filter(n => {
                const date = new Date(n.notice_date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date >= weekAgo;
              }).length}
            </Text>
            <Text style={styles.statLabel}>THIS WEEK</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notices..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.error} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterButton
          title="ALL"
          active={selectedFilter === 'all'}
          onPress={() => setSelectedFilter('all')}
          count={notices.length}
        />
        <FilterButton
          title="WEEK"
          active={selectedFilter === 'week'}
          onPress={() => setSelectedFilter('week')}
          count={notices.filter(n => {
            const date = new Date(n.notice_date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
          }).length}
        />
        <FilterButton
          title="MONTH"
          active={selectedFilter === 'month'}
          onPress={() => setSelectedFilter('month')}
          count={notices.filter(n => {
            const date = new Date(n.notice_date);
            const monthAgo = new Date();
            monthAgo.setDate(monthAgo.getDate() - 30);
            return date >= monthAgo;
          }).length}
        />
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={COLORS.warning} />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Notices List */}
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
        {filteredNotices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-text-outline" size={80} color={COLORS.lightGray} />
            </View>
            <Text style={styles.emptyText}>
              {searchQuery ? 'NO MATCHES FOUND' : 'NO NOTICES AVAILABLE'}
            </Text>
            <Text style={styles.emptySubText}>
              {searchQuery ? 'Try adjusting your search' : 'Check back later for updates'}
            </Text>
          </View>
        ) : (
          filteredNotices.map((notice, index) => (
            <View key={notice.id}>
              <NoticeCard
                notice={notice}
                formatDate={formatDate}
                getTimeAgo={getTimeAgo}
                handleAttachment={handleAttachment}
              />
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function FilterButton({ title, active, onPress, count }) {
  return (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
    >
      {active && <View style={styles.filterStripe} />}
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
        {title}
      </Text>
      {count > 0 && (
        <View style={[styles.countBadge, active && styles.countBadgeActive]}>
          <Text style={[styles.countText, active && styles.countTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function NoticeCard({ notice, formatDate, getTimeAgo, handleAttachment }) {
  const [expanded, setExpanded] = useState(false);
  
  // Remove HTML tags for preview
  const stripHtml = (html) => {
    return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
  };

  const previewText = stripHtml(notice.notice_details);
  const shouldShowMore = previewText.length > 150;

  // HTML rendering config
  const htmlConfig = {
    width: width - 80,
  };

  const tagsStyles = {
    body: {
      color: COLORS.textSecondary,
      fontSize: 14,
      lineHeight: 22,
    },
    br: {
      height: 8,
    },
  };

  return (
    <TouchableOpacity
      style={styles.noticeCard}
      activeOpacity={0.7}
      onPress={() => setExpanded(!expanded)}
    >
      {/* Date Badge */}
      <View style={styles.dateBadge}>
        <LinearGradient
          colors={[COLORS.accent, '#A89063']}
          style={styles.dateBadgeGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.badgeStripe} />
          <Ionicons name="calendar" size={14} color={COLORS.dark} />
          <Text style={styles.dateText}>{formatDate(notice.notice_date)}</Text>
          <View style={styles.badgeDot} />
        </LinearGradient>
      </View>

      {/* Notice Content */}
      <View style={styles.noticeContent}>
        <View style={styles.noticeHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={24} color={COLORS.secondary} />
            <View style={styles.iconDot} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.noticeTitle}>{notice.notice_title}</Text>
            <View style={styles.timeAgoContainer}>
              <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
              <Text style={styles.timeAgo}>{getTimeAgo(notice.notice_date)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.noticeBody}>
          {expanded ? (
            <RenderHtml
              contentWidth={htmlConfig.width}
              source={{ html: notice.notice_details }}
              tagsStyles={tagsStyles}
            />
          ) : (
            <Text style={styles.noticePreview} numberOfLines={3}>
              {previewText}
            </Text>
          )}
        </View>

        {/* Attachment */}
        {notice.notice_attachment && (
          <TouchableOpacity
            style={styles.attachmentButton}
            onPress={() => handleAttachment(notice.notice_attachment)}
          >
            <View style={styles.attachmentIconContainer}>
              <Ionicons name="attach" size={18} color={COLORS.secondary} />
            </View>
            <Text style={styles.attachmentText}>VIEW ATTACHMENT</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.secondary} />
          </TouchableOpacity>
        )}

        {/* Read More Button */}
        {shouldShowMore && (
          <TouchableOpacity
            style={styles.readMoreButton}
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={styles.readMoreText}>
              {expanded ? 'SHOW LESS' : 'READ MORE'}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
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
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  loadingBadge: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  loadingBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
    fontSize: 20,
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.white,
    opacity: 0.9,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: 15,
    height: 50,
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    gap: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.dark,
  },
  filterStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.dark,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  countBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  countText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  countTextActive: {
    color: COLORS.white,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 14,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 12,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    padding: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textPrimary,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  noticeCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dateBadge: {
    alignSelf: 'flex-start',
    marginLeft: 15,
    marginTop: 15,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dateBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeStripe: {
    width: 2,
    height: 16,
    backgroundColor: 'rgba(44, 62, 31, 0.5)',
    borderRadius: 2,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(44, 62, 31, 0.6)',
  },
  dateText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.dark,
    letterSpacing: 0.5,
  },
  noticeContent: {
    padding: 15,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.secondary + '25',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary + '50',
    position: 'relative',
  },
  iconDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.cardBg,
  },
  titleContainer: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  timeAgoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  noticeBody: {
    marginTop: 8,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  noticePreview: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary + '20',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: COLORS.secondary + '40',
    gap: 8,
  },
  attachmentIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.secondary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 0.8,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 0.8,
  },
});