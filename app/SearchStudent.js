import { FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Keyboard,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

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
};

export default function SearchStudentScreen({ navigation }) {
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([
    "RAHUL",
    "PRIYA",
    "ANKIT",
  ]);
  const [hasSearched, setHasSearched] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // Function to handle search
  const handleSearch = async (text = searchText) => {
    if (!text.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    Keyboard.dismiss();

    try {
      const response = await axios.post(
        "https://abma.org.in/binex/api.php?task=search_student",
        { search_text: text }
      );

      if (response.data.status === "success") {
        // Animate results
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();

        setStudents(response.data.data);

        // Add to recent searches if not already there
        if (!recentSearches.includes(text.toUpperCase()) && text.trim()) {
          setRecentSearches((prev) => [
            text.toUpperCase(),
            ...prev.slice(0, 4),
          ]);
        }
      } else {
        setError("No students found");
        setStudents([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search. Please check your connection.");
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear search
  const clearSearch = () => {
    setSearchText("");
    setStudents([]);
    setError(null);
    setHasSearched(false);
  };

  // Function to handle recent search click
  const handleRecentSearch = (text) => {
    setSearchText(text);
    handleSearch(text);
  };

  // Student item component
  const renderStudentCard = ({ item, index }) => {
    // Generate a consistent avatar letter from the student name
    const avatarLetter = item.student_name.charAt(0);
    // Generate military-themed colors
    const avatarColors = [
      COLORS.primary,
      COLORS.secondary,
      COLORS.accent,
      COLORS.success,
      COLORS.warning,
    ];
    const avatarColor = avatarColors[parseInt(item.id) % avatarColors.length];

    return (
      <Animated.View
        style={[
          styles.studentCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: Animated.multiply(
                  slideAnim,
                  new Animated.Value(index + 1)
                ),
              },
            ],
          },
        ]}
      >
        <View style={styles.cardStripe} />
        <View
          style={[styles.avatarContainer, { backgroundColor: avatarColor }]}
        >
          <Text style={styles.avatarText}>{avatarLetter}</Text>
          <View style={styles.avatarBadge}>
            <View style={styles.avatarDot} />
          </View>
        </View>
        <View style={styles.studentInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.studentName}>{item.student_name}</Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <FontAwesome5 name="graduation-cap" size={10} color={COLORS.primary} />
              </View>
              <Text style={styles.detailText}>
                CLASS {item.student_class}-{item.student_section}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <FontAwesome5 name="user" size={10} color={COLORS.primary} />
              </View>
              <Text style={styles.detailText}>{item.student_father}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailIconContainer}>
                <FontAwesome5 name="phone-alt" size={10} color={COLORS.primary} />
              </View>
              <Text style={styles.detailText}>{item.student_mobile}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.attendanceButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              <LinearGradient
                colors={[COLORS.secondary, COLORS.primary]}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.actionButtonStripe} />
                <FontAwesome5 name="clipboard-check" size={12} color={COLORS.white} />
                <Text style={styles.actionButtonText}>ATTENDANCE</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.feesButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({
                  pathname: "/PayFee",
                  params: {
                    student_id: item.id,
                    student_name: item.student_name,
                    student_class: item.student_class,
                    student_section: item.student_section,
                    student_father: item.student_father,
                    student_mobile: item.student_mobile,
                    admission_no:
                      item.admission_no ||
                      `DPS/${new Date().getFullYear()}/${item.id}`,
                  },
                });
              }}
            >
              <LinearGradient
                colors={[COLORS.accent, '#A89063']}
                style={styles.actionButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.actionButtonStripe} />
                <FontAwesome5 name="money-bill-wave" size={12} color={COLORS.dark} />
                <Text style={[styles.actionButtonText, { color: COLORS.dark }]}>PAY FEES</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Recent search pill component
  const renderRecentSearch = ({ item }) => (
    <TouchableOpacity
      style={styles.recentPill}
      onPress={() => handleRecentSearch(item)}
    >
      <View style={styles.recentIconContainer}>
        <FontAwesome5 name="history" size={10} color={COLORS.primary} />
      </View>
      <Text style={styles.recentText}>{item}</Text>
      <View style={styles.recentDot} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

        <View style={styles.header}>
          <LinearGradient
            colors={[COLORS.dark, COLORS.primary, COLORS.secondary]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <FontAwesome5 name="arrow-left" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>SEARCH STUDENTS</Text>
              <View style={styles.headerUnderline} />
            </View>
            <View style={styles.placeholder} />
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <View style={styles.searchIconContainer}>
              <FontAwesome5 name="search" size={16} color={COLORS.primary} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
              autoCapitalize="words"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <View style={styles.clearButton}>
                  <FontAwesome5 name="times" size={14} color={COLORS.error} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => handleSearch()}
          >
            <LinearGradient
              colors={[COLORS.accent, '#A89063']}
              style={styles.searchBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.searchBtnStripe} />
              <FontAwesome5 name="search" size={20} color={COLORS.dark} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {!hasSearched && recentSearches.length > 0 && (
          <View style={styles.recentContainer}>
            <View style={styles.recentHeader}>
              <View style={styles.recentHeaderDot} />
              <Text style={styles.recentTitle}>RECENT SEARCHES</Text>
            </View>
            <FlatList
              data={recentSearches}
              renderItem={renderRecentSearch}
              keyExtractor={(item, index) => "recent-" + index}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentList}
            />
          </View>
        )}

        {isLoading ? (
          <View style={styles.centerContainer}>
            <View style={styles.loadingCircle}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
            <Text style={styles.loadingText}>SEARCHING...</Text>
            <View style={styles.loadingBadge}>
              <Text style={styles.loadingBadgeText}>TACTICAL SEARCH</Text>
            </View>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <View style={styles.errorIconContainer}>
              <FontAwesome5 name="exclamation-circle" size={50} color={COLORS.error} />
            </View>
            <Text style={styles.errorTitle}>SEARCH FAILED</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => handleSearch()}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.retryButtonGradient}
              >
                <View style={styles.buttonStripe} />
                <Text style={styles.retryText}>RETRY</Text>
                <FontAwesome5 name="redo" size={14} color={COLORS.white} style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : hasSearched && students.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.noResultsIconContainer}>
              <Image
                source={require("./assets/no-results.png")}
                style={styles.noResultsImage}
              />
            </View>
            <Text style={styles.noResultsTitle}>NO STUDENTS FOUND</Text>
            <Text style={styles.noResultsText}>
              Try searching with a different name
            </Text>
          </View>
        ) : (
          <FlatList
            data={students}
            renderItem={renderStudentCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              !hasSearched ? (
                <View style={styles.centerContainer}>
                  <View style={styles.emptyIconContainer}>
                    <Image
                      source={require("./assets/search-illustration.png")}
                      style={styles.emptyImage}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>FIND STUDENTS</Text>
                  <Text style={styles.emptyText}>
                    Search by student name to view details
                  </Text>
                </View>
              ) : null
            }
          />
        )}

        {students.length > 0 && (
          <BlurView intensity={80} tint="light" style={styles.fabContainer}>
            <View style={styles.fabStripe} />
            <FontAwesome5 name="users" size={14} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.resultCount}>
              FOUND {students.length} STUDENT{students.length !== 1 ? "S" : ""}
            </Text>
            <View style={styles.fabDot} />
          </BlurView>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 100,
    overflow: "hidden",
  },
  headerGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 100,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
    letterSpacing: 2,
  },
  headerUnderline: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  searchIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    marginLeft: 12,
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  searchBtnGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: 'relative',
  },
  searchBtnStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: 'rgba(44, 62, 31, 0.5)',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  recentContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  recentHeaderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  recentList: {
    paddingRight: 20,
  },
  recentPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 6,
  },
  recentIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  recentText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  recentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    fontSize: 14,
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
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.error,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: '500',
  },
  retryButton: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonStripe: {
    width: 3,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 2,
    marginRight: 8,
  },
  retryText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1.2,
  },
  noResultsIconContainer: {
    padding: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  noResultsImage: {
    width: 120,
    height: 120,
    opacity: 0.8,
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  noResultsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: '500',
  },
  emptyIconContainer: {
    padding: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  emptyImage: {
    width: 140,
    height: 140,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  studentCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    flexDirection: "row",
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    position: 'relative',
  },
  cardStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "bold",
  },
  avatarBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  studentInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    flex: 1,
    letterSpacing: 0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success + '40',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  statusText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  detailsRow: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    position: 'relative',
  },
  actionButtonStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.8,
  },
  attendanceButton: {},
  feesButton: {},
  fabContainer: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  fabStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: 23,
    borderBottomLeftRadius: 23,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  fabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginLeft: 8,
  },
});