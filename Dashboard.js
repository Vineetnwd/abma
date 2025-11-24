import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function DashboardScreen({ navigation, route }) {
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    student: 0,
    absent: 0,
    collection: "0.00",
    full_name: "",
    user_type: ""
  });
  const [userId, setUserId] = useState('XXX');

  useEffect(() => {
    // Set greeting based on time of day
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setGreeting("Good Morning");
    } else if (currentHour < 18) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }

    // Fetch dashboard data
    fetchDashboardData();
    loadUserId();
  }, []);

  const loadUserId = async () => {
    const id = await AsyncStorage.getItem('user_id') || 'XXX';
    setUserId(id);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Get user_id from AsyncStorage
      const userId = await AsyncStorage.getItem('user_id') || '2';
      
      const response = await fetch('https://abma.org.in/binex/api.php?task=dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: parseInt(userId) }),
      });
      
      const data = await response.json();
      setDashboardData(data);
      console.log("Dashboard data:", data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Mission End',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Negative',
          style: 'cancel'
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // Clear all AsyncStorage data
              await AsyncStorage.multiRemove([
                'user_id',
                'full_name',
                'user_type',
                'isLoggedIn'
              ]);
              
              // Navigate to login screen
              router.replace('/admin_login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const menuItems = [
    {
      id: 1,
      title: "Search Student",
      icon: "search",
      color: "#7CB342",
      gradient: ["#7CB342", "#8BC34A"],
      route: "SearchStudent",
      description: "Locate personnel records",
    },
    {
      id: 2,
      title: "Make Attendance",
      icon: "clipboard-check",
      color: "#29B6F6",
      gradient: ["#29B6F6", "#4FC3F7"],
      route: "Attendance",
      description: "Roll call operations",
    },
    {
      id: 4,
      title: "Collection Report",
      icon: "file-invoice-dollar",
      color: "#FFB300",
      gradient: ["#FFB300", "#FFC107"],
      route: "CollectionReport",
      description: "Financial intel report",
    },
    {
      id: 5,
      title: "Dues List",
      icon: "exclamation-triangle",
      color: "#FF7043",
      gradient: ["#FF7043", "#FF8A65"],
      route: "DuesList",
      description: "Outstanding missions",
    },
    {
      id: 6,
      title: "Homework",
      icon: "book",
      color: "#26A69A",
      gradient: ["#26A69A", "#4DB6AC"],
      route: "HomeWork",
      description: "Mission assignments",
    },
    {
      id: 7,
      title: "Notice Board",
      icon: "bullhorn",
      color: "#AB47BC",
      gradient: ["#AB47BC", "#BA68C8"],
      route: "Notice",
      description: "Command broadcasts",
    },
    {
      id: 8,
      title: "Leave Applications",
      icon: "calendar-alt",
      color: "#EF5350",
      gradient: ["#EF5350", "#E57373"],
      route: "AppliedLeaveScreen",
      description: "Personnel leave requests",
      adminOnly: true,
    },
    {
      id: 9,
      title: "Complaints",
      icon: "comments",
      color: "#5C6BC0",
      gradient: ["#5C6BC0", "#7986CB"],
      route: "ComplaintsScreen",
      description: "Incident reports",
      adminOnly: true,
    },
  ];

  const handleMenuPress = (route) => {
    router.push(`/${route}`);
    console.log(`Navigating to ${route}`);
  };

  // Format currency with ₹ symbol
  const formatCurrency = (amount) => {
    return `₹${amount}`;
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
          <LinearGradient
            colors={["#7CB342", "#8BC34A", "#9CCC65"]}
            style={styles.loadingContainer}
          >
            <ActivityIndicator size="large" color="#FFD740" />
            <Text style={styles.loadingText}>LOADING COMMAND CENTER...</Text>
            <View style={styles.loadingBorder}>
              <View style={styles.loadingBorderInner} />
            </View>
          </LinearGradient>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor="#7CB342" />

        <View style={styles.header}>
          <LinearGradient
            colors={["#7CB342", "#8BC34A", "#9CCC65"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          />
          {/* Tactical stripes */}
          <View style={styles.tacticalStripe} />
          <View style={[styles.tacticalStripe, { top: 8 }]} />
          
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <View style={styles.rankBadge}>
                <FontAwesome5 name="star" size={10} color="#FFD740" />
              </View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.userName}>{dashboardData.full_name}</Text>
              <View style={styles.userRolePill}>
                <FontAwesome5 name="shield-alt" size={10} color="#FFD740" style={{ marginRight: 6 }} />
                <Text style={styles.userRole}>{dashboardData.user_type}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarBorder}>
                  <Image
                    source={require("./assets/logo.png")}
                    style={styles.avatar}
                    defaultSource={require("./assets/default.png")}
                  />
                </View>
                <View style={styles.statusIndicator}>
                  <View style={styles.statusPulse} />
                </View>
              </View>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <FontAwesome5 name="power-off" size={14} color="#FF5252" />
                <Text style={styles.logoutText}>SIGN OUT</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerBottom}>
            <View style={styles.serialNumber}>
              <Text style={styles.serialText}>ID: {userId}</Text>
            </View>
            <View style={styles.statusBar}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ACTIVE</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dashboardHeader}>
            <View style={styles.titleContainer}>
              <FontAwesome5 name="chess-rook" size={24} color="#FFD740" />
              <View style={styles.titleTextContainer}>
                <Text style={styles.dashboardTitle}>ADMIN CENTER</Text>
              </View>
            </View>
            <View style={styles.dateContainer}>
              <FontAwesome5 name="calendar-day" size={12} color="#7CB342" style={{ marginRight: 8 }} />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>

          <View style={styles.quickStatsContainer}>
            <LinearGradient
              colors={["#29B6F6", "#4FC3F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickStatCard}
            >
              <View style={styles.statHeader}>
                <Text style={styles.quickStatLabel}>PERSONNEL</Text>
                <FontAwesome5 name="users" size={16} color="#fff" />
              </View>
              <Text style={styles.quickStatNumber}>{dashboardData.student}</Text>
              <View style={styles.statDivider} />
              <Text style={styles.statFooter}>Total Strength</Text>
            </LinearGradient>

            <LinearGradient
              colors={["#FFB300", "#FFC107"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickStatCard}
            >
              <View style={styles.statHeader}>
                <Text style={styles.quickStatLabel}>FUNDS</Text>
                <FontAwesome5 name="money-bill-wave" size={16} color="#fff" />
              </View>
              <Text style={styles.quickStatNumber}>
                {formatCurrency(dashboardData.collection)}
              </Text>
              <View style={styles.statDivider} />
              <Text style={styles.statFooter}>Total Secured</Text>
            </LinearGradient>

            <LinearGradient
              colors={["#FF7043", "#FF8A65"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quickStatCard}
            >
              <View style={styles.statHeader}>
                <Text style={styles.quickStatLabel}>ABSENT</Text>
                <FontAwesome5 name="user-slash" size={16} color="#fff" />
              </View>
              <Text style={styles.quickStatNumber}>{dashboardData.absent}</Text>
              <View style={styles.statDivider} />
              <Text style={styles.statFooter}>Off Duty Today</Text>
            </LinearGradient>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>TACTICAL OPERATIONS</Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.route)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={styles.menuItemGradient}
                >
                  <View style={styles.menuCorner} />
                  <View style={[styles.menuCorner, styles.menuCornerTopRight]} />
                  <View style={[styles.menuCorner, styles.menuCornerBottomLeft]} />
                  <View style={[styles.menuCorner, styles.menuCornerBottomRight]} />
                  
                  <View style={styles.iconContainer}>
                    <FontAwesome5 name={item.icon} size={22} color="#fff" />
                    <View style={styles.iconBadge} />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                  
                  <View style={styles.menuFooter}>
                    <FontAwesome5 name="angle-right" size={12} color="#fff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>RECENT OPERATIONS</Text>
            <View style={styles.sectionDivider} />
          </View>

          <LinearGradient
            colors={["#ffffff", "#f5fff5"]}
            style={styles.recentActivityContainer}
          >
            <View style={styles.activityBorder} />
            
            <View style={styles.recentActivityHeader}>
              <View style={styles.activityHeaderLeft}>
                <FontAwesome5 name="history" size={16} color="#7CB342" />
                <Text style={styles.recentActivityTitle}>Mission Log</Text>
              </View>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>VIEW ALL</Text>
                <FontAwesome5 name="arrow-right" size={10} color="#7CB342" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>

            <View style={styles.activityList}>
              <View style={styles.activityItem}>
                <LinearGradient
                  colors={["#FFB300", "#FFC107"]}
                  style={styles.activityIconContainer}
                >
                  <FontAwesome5 name="rupee-sign" size={14} color="#fff" />
                </LinearGradient>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Payment Secured</Text>
                  <Text style={styles.activityDescription}>
                    Rahul Kumar - Class 8A - ₹3,500
                  </Text>
                </View>
                <View style={styles.activityTimeContainer}>
                  <FontAwesome5 name="clock" size={10} color="#7CB342" />
                  <Text style={styles.activityTime}>10:15</Text>
                </View>
              </View>

              <View style={styles.activityDivider} />

              <View style={styles.activityItem}>
                <LinearGradient
                  colors={["#29B6F6", "#4FC3F7"]}
                  style={styles.activityIconContainer}
                >
                  <FontAwesome5 name="clipboard-check" size={14} color="#fff" />
                </LinearGradient>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Roll Call Complete</Text>
                  <Text style={styles.activityDescription}>
                    Class 10B - 32 Present, 3 Absent
                  </Text>
                </View>
                <View style={styles.activityTimeContainer}>
                  <FontAwesome5 name="clock" size={10} color="#7CB342" />
                  <Text style={styles.activityTime}>09:30</Text>
                </View>
              </View>

              <View style={styles.activityDivider} />

              <View style={styles.activityItem}>
                <LinearGradient
                  colors={["#26A69A", "#4DB6AC"]}
                  style={styles.activityIconContainer}
                >
                  <FontAwesome5 name="book" size={14} color="#fff" />
                </LinearGradient>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Mission Assigned</Text>
                  <Text style={styles.activityDescription}>
                    Mathematics - Class 9A
                  </Text>
                </View>
                <View style={styles.activityTimeContainer}>
                  <FontAwesome5 name="clock" size={10} color="#7CB342" />
                  <Text style={styles.activityTime}>Yesterday</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Military footer badge */}
          <View style={styles.footerBadge}>
            <View style={styles.badgeBorder} />
            <FontAwesome5 name="shield-alt" size={20} color="#7CB342" />
            <Text style={styles.footerText}>SECURE OPERATIONS</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8f0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  loadingBorder: {
    marginTop: 20,
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  loadingBorderInner: {
    width: '60%',
    height: '100%',
    backgroundColor: '#FFD740',
    borderRadius: 2,
  },
  header: {
    height: 180,
    overflow: "hidden",
    position: 'relative',
  },
  headerGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 180,
  },
  tacticalStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#FFD740',
    opacity: 0.5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingTop: 12,
  },
  userInfo: {
    flex: 1,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: 0,
    left: -8,
    width: 20,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD740',
  },
  greeting: {
    fontSize: 13,
    color: "#fff",
    marginBottom: 4,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  userRolePill: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    alignSelf: "flex-start",
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#FFD740',
  },
  userRole: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerActions: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#FFD740',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  logoutText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 6,
    letterSpacing: 1,
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  serialNumber: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 3,
    borderLeftWidth: 2,
    borderLeftColor: '#FFD740',
  },
  serialText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD740',
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  dashboardHeader: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#7CB342',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2d3436",
    letterSpacing: 2,
  },
  dashboardSubtitle: {
    fontSize: 11,
    color: "#7CB342",
    marginTop: 2,
    letterSpacing: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: "#636e72",
    fontWeight: '600',
  },
  quickStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  quickStatCard: {
    width: (width - 48) / 3,
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickStatLabel: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
  },
  quickStatNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 6,
  },
  statFooter: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionDivider: {
    flex: 1,
    height: 2,
    backgroundColor: '#7CB342',
    opacity: 0.3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#7CB342",
    marginHorizontal: 12,
    letterSpacing: 2,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  menuItem: {
    width: (width - 48) / 2,
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  menuItemGradient: {
    padding: 14,
    position: 'relative',
    borderRadius: 8,
  },
  menuCorner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  menuCornerTopRight: {
    left: 'auto',
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 2,
  },
  menuCornerBottomLeft: {
    top: 'auto',
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 2,
  },
  menuCornerBottomRight: {
    top: 'auto',
    left: 'auto',
    right: 0,
    bottom: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD740',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  menuDescription: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
  },
  menuFooter: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  recentActivityContainer: {
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e8f5e9',
  },
  activityBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#7CB342',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  recentActivityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activityHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentActivityTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2d3436",
    marginLeft: 8,
    letterSpacing: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  viewAllText: {
    fontSize: 10,
    color: "#7CB342",
    fontWeight: '700',
    letterSpacing: 1,
  },
  activityList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2d3436",
    marginBottom: 3,
  },
  activityDescription: {
    fontSize: 11,
    color: "#636e72",
  },
  activityTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activityTime: {
    fontSize: 10,
    color: "#7CB342",
    fontWeight: '600',
    marginLeft: 4,
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#e8f5e9',
    marginVertical: 4,
  },
  footerBadge: {
    alignItems: 'center',
    paddingVertical: 20,
    position: 'relative',
  },
  badgeBorder: {
    position: 'absolute',
    top: 10,
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: '#7CB342',
    opacity: 0.3,
  },
  footerText: {
    marginTop: 8,
    fontSize: 11,
    color: '#7CB342',
    fontWeight: '700',
    letterSpacing: 2,
  },
});