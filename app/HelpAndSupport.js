import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
  whatsapp: '#556B2F',      // Dark Olive for WhatsApp
  phone: '#4A5D23',         // Olive Drab for Phone
  email: '#8B4513',         // Saddle Brown for Email
  web: '#3E4A2D',           // Dark Forest for Web
};

export default function HelpSupportScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supportData, setSupportData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        'https://abma.org.in/binex/api.php?task=help_and_support',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      if (data) {
        setSupportData(data);
        await AsyncStorage.setItem('cached_support', JSON.stringify(data));
      } else {
        setError('No support information available');
      }
    } catch (err) {
      console.error('Error fetching support data:', err);
      setError('Failed to load support information');
      
      try {
        const cachedData = await AsyncStorage.getItem('cached_support');
        if (cachedData) {
          setSupportData(JSON.parse(cachedData));
          setError('Showing cached data. Network error occurred.');
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
    fetchSupportData();
  };

  const handleCall = (phone) => {
    const phoneNumber = phone.replace(/\s/g, '');
    Linking.openURL(`tel:${phoneNumber}`).catch(err => {
      Alert.alert('Error', 'Unable to make a call');
      console.error('Error making call:', err);
    });
  };

  const handleEmail = (email) => {
    Linking.openURL(`mailto:${email}`).catch(err => {
      Alert.alert('Error', 'Unable to open email client');
      console.error('Error opening email:', err);
    });
  };

  const handleWebsite = (website) => {
    let url = website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Unable to open website');
      console.error('Error opening website:', err);
    });
  };

  const handleWhatsApp = (wpLink) => {
    Linking.openURL(wpLink).catch(err => {
      Alert.alert('Error', 'Unable to open WhatsApp');
      console.error('Error opening WhatsApp:', err);
    });
  };

  const handleMap = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const url = Platform.OS === 'ios' 
      ? `maps://app?q=${encodedAddress}`
      : `geo:0,0?q=${encodedAddress}`;
    
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`);
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoCircle}>
          <Ionicons name="help-circle" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.loadingText}>LOADING SUPPORT INFO...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>HELP & SUPPORT</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Info Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="headset" size={32} color={COLORS.accent} />
          </View>
          <Text style={styles.headerCardText}>
            We're here to help! Reach out to us anytime
          </Text>
        </View>
      </LinearGradient>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="information-circle" size={16} color={COLORS.error} />
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

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
        {supportData && (
          <>
            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="flash" size={18} color={COLORS.accent} /> QUICK ACTIONS
              </Text>
              <View style={styles.quickActionsGrid}>
                <QuickActionCard
                  icon="call"
                  label="CALL US"
                  color={COLORS.phone}
                  onPress={() => handleCall(supportData.contact)}
                />
                <QuickActionCard
                  icon="logo-whatsapp"
                  label="WHATSAPP"
                  color={COLORS.whatsapp}
                  onPress={() => handleWhatsApp(supportData.wp_channel)}
                />
                <QuickActionCard
                  icon="mail"
                  label="EMAIL"
                  color={COLORS.email}
                  onPress={() => handleEmail(supportData.email)}
                />
                <QuickActionCard
                  icon="globe"
                  label="WEBSITE"
                  color={COLORS.web}
                  onPress={() => handleWebsite(supportData.website)}
                />
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="information-circle" size={18} color={COLORS.accent} /> CONTACT INFORMATION
              </Text>

              {/* Phone */}
              <ContactCard
                icon="call"
                iconColor={COLORS.phone}
                title="PHONE NUMBER"
                content={supportData.contact}
                onPress={() => handleCall(supportData.contact)}
                actionIcon="call-outline"
              />

              {/* WhatsApp */}
              <ContactCard
                icon="logo-whatsapp"
                iconColor={COLORS.whatsapp}
                title="WHATSAPP SUPPORT"
                content="Chat with us on WhatsApp"
                onPress={() => handleWhatsApp(supportData.wp_channel)}
                actionIcon="chatbubbles"
              />

              {/* Email */}
              <ContactCard
                icon="mail"
                iconColor={COLORS.email}
                title="EMAIL ADDRESS"
                content={supportData.email}
                onPress={() => handleEmail(supportData.email)}
                actionIcon="send"
              />

              {/* Website */}
              <ContactCard
                icon="globe"
                iconColor={COLORS.web}
                title="WEBSITE"
                content={supportData.website}
                onPress={() => handleWebsite(supportData.website)}
                actionIcon="open"
              />

              {/* Address */}
              <ContactCard
                icon="location"
                iconColor={COLORS.accent}
                title="SCHOOL ADDRESS"
                content={supportData.address}
                onPress={() => handleMap(supportData.address)}
                actionIcon="navigate"
                multiline
              />
            </View>

            {/* Office Hours */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="time" size={18} color={COLORS.accent} /> OFFICE HOURS
              </Text>
              <View style={styles.hoursCard}>
                <View style={styles.hoursRow}>
                  <Ionicons name="sunny" size={20} color={COLORS.accent} />
                  <Text style={styles.hoursDay}>MONDAY - FRIDAY</Text>
                  <Text style={styles.hoursTime}>8:00 AM - 4:00 PM</Text>
                </View>
                <View style={styles.hoursDivider} />
                <View style={styles.hoursRow}>
                  <Ionicons name="partly-sunny" size={20} color={COLORS.accent} />
                  <Text style={styles.hoursDay}>SATURDAY</Text>
                  <Text style={styles.hoursTime}>8:00 AM - 1:00 PM</Text>
                </View>
                <View style={styles.hoursDivider} />
                <View style={styles.hoursRow}>
                  <Ionicons name="moon" size={20} color={COLORS.gray} />
                  <Text style={styles.hoursDay}>SUNDAY</Text>
                  <Text style={[styles.hoursTime, { color: COLORS.error }]}>CLOSED</Text>
                </View>
              </View>
            </View>

            {/* FAQs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="help-circle" size={18} color={COLORS.accent} /> FREQUENTLY ASKED QUESTIONS
              </Text>
              
              <FAQCard
                question="How do I apply for leave?"
                answer="You can apply for leave through the 'Apply Leave' section in the app. Fill in the required details and submit your request."
              />
              
              <FAQCard
                question="How can I check my attendance?"
                answer="Navigate to the Attendance section to view your monthly attendance records with detailed calendar view."
              />
              
              <FAQCard
                question="Where can I view homework assignments?"
                answer="All homework assignments are available in the Homework section, organized by date with downloadable attachments."
              />
              
              <FAQCard
                question="How do I submit a complaint?"
                answer="Use the Complaint section to submit your concerns. Select the appropriate department and describe your issue."
              />
            </View>

            {/* Emergency Contact */}
            <View style={styles.emergencyCard}>
              <LinearGradient
                colors={[COLORS.error, '#A0522D']}
                style={styles.emergencyGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="alert-circle" size={32} color={COLORS.accent} />
                <View style={styles.emergencyContent}>
                  <Text style={styles.emergencyTitle}>EMERGENCY CONTACT</Text>
                  <Text style={styles.emergencyText}>
                    For urgent matters, please call us immediately
                  </Text>
                  <TouchableOpacity
                    style={styles.emergencyButton}
                    onPress={() => handleCall(supportData.contact)}
                  >
                    <Ionicons name="call" size={18} color={COLORS.error} />
                    <Text style={styles.emergencyButtonText}>{supportData.contact}</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function QuickActionCard({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20', borderColor: color + '40' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ContactCard({ icon, iconColor, title, content, onPress, actionIcon, multiline }) {
  return (
    <View style={styles.contactCard}>
      <View style={[styles.contactIcon, { backgroundColor: iconColor + '20', borderColor: iconColor + '40' }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={styles.contactContent}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={[styles.contactText, multiline && styles.contactTextMultiline]}>
          {content}
        </Text>
      </View>
      <TouchableOpacity style={styles.contactAction} onPress={onPress}>
        <Ionicons name={actionIcon} size={20} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}

function FAQCard({ question, answer }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.faqCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Ionicons 
          name={expanded ? "remove-circle" : "add-circle"} 
          size={24} 
          color={COLORS.accent} 
        />
        <Text style={styles.faqQuestion}>{question}</Text>
      </View>
      {expanded && (
        <Text style={styles.faqAnswer}>{answer}</Text>
      )}
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
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    gap: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  headerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent + '30',
  },
  headerCardText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
    fontWeight: '500',
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
  section: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 15,
    letterSpacing: 1,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  contactCard: {
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
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  contactText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  contactTextMultiline: {
    lineHeight: 20,
    fontWeight: '600',
  },
  contactAction: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  hoursCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  hoursDay: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  hoursTime: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '700',
  },
  hoursDivider: {
    height: 1,
    backgroundColor: COLORS.lightGray + '60',
    marginVertical: 8,
  },
  faqCard: {
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
    borderLeftColor: COLORS.accent,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginTop: 12,
    marginLeft: 36,
    fontWeight: '500',
  },
  emergencyCard: {
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 30,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  emergencyGradient: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginBottom: 4,
    letterSpacing: 1.2,
  },
  emergencyText: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.95,
    marginBottom: 12,
    fontWeight: '500',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  emergencyButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.error,
  },
});
