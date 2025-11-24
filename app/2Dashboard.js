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
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Get user_id from AsyncStorage
      const userId = await AsyncStorage.getItem('user_id') || '2';
      
      const response = await fetch('https://dpsmushkipur.com/bine/api.php?task=dashboard', {
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
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
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
              //router.replace('/index');
              router.replace('/admin_login'); // or '/login'
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
      color: "#4361ee",
      route: "SearchStudent",
      description: "Find student records",
    },
    {
      id: 2,
      title: "Make Attendance",
      icon: "clipboard-check",
      color: "#3a86ff",
      route: "Attendance",
      description: "Mark daily attendance",
    },
    {
      id: 4,
      title: "Collection Report",
      icon: "file-invoice-dollar",
      color: "#fb8500",
      route: "CollectionReport",
      description: "View fee collection stats",
    },
    {
      id: 5,
      title: "Dues List",
      icon: "exclamation-circle",
      color: "#d62828",
      route: "DuesList",
      description: "Check pending payments",
    },
    {
      id: 6,
      title: "Homework",
      icon: "book",
      color: "#7209b7",
      route: "HomeWork",
      description: "Assign & track homework",
    },
    {
      id: 7,
      title: "Notice Board",
      icon: "bullhorn",
      color: "#4cc9f0",
      route: "Notice",
      description: "Update Important Notices",
    },
    {
      id: 8,
      title: "Leave Applications",
      icon: "calendar-alt",
      color: "#f72585",
      route: "AppliedLeaveScreen",
      description: "Review Student Leaves",
      adminOnly: true,
    },
    {
      id: 9,
      title: "Complaints",
      icon: "comments",
      color: "#7209b7",
      route: "ComplaintsScreen",
      description: "View Student Complaints",
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
            colors={["#1e3c72", "#2a5298"]}
            style={styles.loadingContainer}
          >
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading Dashboard...</Text>
          </LinearGradient>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#1e3c72" />

        <View style={styles.header}>
          <LinearGradient
            colors={["#1e3c72", "#2a5298"]}
            style={styles.headerGradient}
          />
          <View style={styles.headerContent}>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.userName}>{dashboardData.full_name}</Text>
              <View style={styles.userRolePill}>
                <Text style={styles.userRole}>{dashboardData.user_type}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <View style={styles.avatarContainer}>
                <Image
                  source={require("./assets/logo.png")}
                  style={styles.avatar}
                  defaultSource={require("./assets/default.png")}
                />
                <View style={styles.statusIndicator} />
              </View>
              <TouchableOpacity 
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="sign-out-alt" size={18} color="white" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dashboardHeader}>
            <Text style={styles.dashboardTitle}>School Dashboard</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>

          <View style={styles.quickStatsContainer}>
            <View
              style={[styles.quickStatCard, { backgroundColor: "#4cc9f0" }]}
            >
              <Text style={styles.quickStatNumber}>{dashboardData.student}</Text>
              <Text style={styles.quickStatLabel}>Total Students</Text>
              <FontAwesome5
                name="users"
                size={24}
                color="rgba(255,255,255,0.3)"
                style={styles.statIcon}
              />
            </View>
            <View
              style={[styles.quickStatCard, { backgroundColor: "#38b000" }]}
            >
              <Text style={styles.quickStatNumber}>
                {formatCurrency(dashboardData.collection)}
              </Text>
              <Text style={styles.quickStatLabel}>Total Collection</Text>
              <FontAwesome5
                name="rupee-sign"
                size={24}
                color="rgba(255,255,255,0.3)"
                style={styles.statIcon}
              />
            </View>
            <View
              style={[styles.quickStatCard, { backgroundColor: "#d62828" }]}
            >
              <Text style={styles.quickStatNumber}>{dashboardData.absent}</Text>
              <Text style={styles.quickStatLabel}>Absent Today</Text>
              <FontAwesome5
                name="user-slash"
                size={24}
                color="rgba(255,255,255,0.3)"
                style={styles.statIcon}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Management Tools</Text>

          <View style={styles.menuGrid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.route)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: item.color },
                  ]}
                >
                  <FontAwesome5 name={item.icon} size={24} color="#ffffff" />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.recentActivityContainer}>
            <View style={styles.recentActivityHeader}>
              <Text style={styles.recentActivityTitle}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.activityList}>
              <View style={styles.activityItem}>
                <View
                  style={[
                    styles.activityIconContainer,
                    { backgroundColor: "#4361ee" },
                  ]}
                >
                  <FontAwesome5 name="rupee-sign" size={16} color="#ffffff" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Fee Collected</Text>
                  <Text style={styles.activityDescription}>
                    Rahul Kumar - Class 8A - ₹3,500
                  </Text>
                </View>
                <Text style={styles.activityTime}>10:15 AM</Text>
              </View>

              <View style={styles.activityItem}>
                <View
                  style={[
                    styles.activityIconContainer,
                    { backgroundColor: "#3a86ff" },
                  ]}
                >
                  <FontAwesome5
                    name="clipboard-check"
                    size={16}
                    color="#ffffff"
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Attendance Marked</Text>
                  <Text style={styles.activityDescription}>
                    Class 10B - 32 Present, 3 Absent
                  </Text>
                </View>
                <Text style={styles.activityTime}>09:30 AM</Text>
              </View>

              <View style={styles.activityItem}>
                <View
                  style={[
                    styles.activityIconContainer,
                    { backgroundColor: "#7209b7" },
                  ]}
                >
                  <FontAwesome5 name="book" size={16} color="#ffffff" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Homework Assigned</Text>
                  <Text style={styles.activityDescription}>
                    Mathematics - Class 9A
                  </Text>
                </View>
                <Text style={styles.activityTime}>Yesterday</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
  },
  header: {
    height: 140, // Increased height to accommodate logout button
    overflow: "hidden",
  },
  headerGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 140, // Match the header height
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingTop: 15,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: "#e0e0e0",
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  userRolePill: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  userRole: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  headerActions: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
    padding: 4,
  },
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4cd137",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  logoutText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 30,  // Reduced padding since bottom bar is removed
  },
  dashboardHeader: {
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  quickStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  quickStatCard: {
    width: (width - 50) / 3,
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickStatNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: "#ffffff",
    opacity: 0.8,
  },
  statIcon: {
    position: "absolute",
    right: 8,
    bottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  menuItem: {
    width: (width - 50) / 2,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 12,
    color: "#7f8c8d",
  },
  recentActivityContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentActivityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recentActivityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  viewAllText: {
    fontSize: 14,
    color: "#3498db",
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 13,
    color: "#7f8c8d",
  },
  activityTime: {
    fontSize: 12,
    color: "#95a5a6",
  },
});