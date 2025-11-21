import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const COLORS = {
  primary: '#2D3A2E',          // Dark Military Green
  secondary: '#4A5D23',        // Olive Drab
  tertiary: '#556B2F',         // Dark Olive Green
  accent: '#D4AF37',           // Military Gold
  accentLight: '#E8C468',      // Light Military Gold
  white: '#FFFFFF',
  offWhite: '#F5F5DC',         // Beige
  gray: '#6B7280',
  lightGray: '#D1D5DB',
  darkGray: '#374151',
  error: '#DC2626',            // Combat Red
  success: '#16A34A',          // Military Green
  background: '#E8E6E0',       // Light Tan
  camouflage: '#78866B',       // Camouflage Green
  sand: '#C3B091',             // Desert Sand
  combat: '#1F2937',           // Combat Black
};

// Class and Section options
const CLASS_OPTIONS = [
  { label: 'NUR', value: 'NUR' },
  { label: 'LKG', value: 'LKG' },
  { label: 'UKG', value: 'UKG' },
  { label: 'I', value: 'I' },
  { label: 'II', value: 'II' },
  { label: 'III', value: 'III' },
  { label: 'IV', value: 'IV' },
  { label: 'V', value: 'V' },
  { label: 'VI', value: 'VI' },
  { label: 'VII', value: 'VII' },
  { label: 'VIII', value: 'VIII' },
  { label: 'IX', value: 'IX' },
  { label: 'X', value: 'X' }
];

const SECTION_OPTIONS = [
  { label: 'Section A', value: 'A' },
  { label: 'Section B', value: 'B' },
  { label: 'Section C', value: 'C' }
];

// Month names for date picker
const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

export default function AttendanceScreen() {
  const router = useRouter();
  
  // State for class and section selection
  const [selectedClass, setSelectedClass] = useState('II');
  const [selectedSection, setSelectedSection] = useState('A');
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  
  // State for date and attendance
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  
  // Summary state
  const [summary, setSummary] = useState({
    total: 0,
    present: 0,
    absent: 0,
    percentPresent: 0
  });
  
  // Filter state
  const [showOnlyAbsent, setShowOnlyAbsent] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  
  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedSection]);
  
  useEffect(() => {
    filterStudents();
  }, [searchQuery, students, attendance, showOnlyAbsent]);
  
  useEffect(() => {
    calculateSummary();
  }, [attendance, students]);
  
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        'https://abma.org.in/binex/api.php?task=student_list',
        {
          student_class: selectedClass,
          student_section: selectedSection
        }
      );
      
      if (response.data.status === 'success') {
        const studentsWithStatus = response.data.data.map(student => ({
          ...student,
          isPresent: true
        }));
        
        setStudents(studentsWithStatus);
        
        const newAttendance = {};
        studentsWithStatus.forEach(student => {
          newAttendance[student.id] = true;
        });
        
        setAttendance(newAttendance);
      } else {
        Alert.alert('Error', 'Failed to load student list');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      Alert.alert('Error', 'An error occurred while fetching student list');
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterStudents = () => {
    let filtered = [...students];
    
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(student => 
        student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_roll.includes(searchQuery) ||
        student.student_admission.includes(searchQuery)
      );
    }
    
    if (showOnlyAbsent) {
      filtered = filtered.filter(student => !attendance[student.id]);
    }
    
    filtered.sort((a, b) => parseInt(a.student_roll) - parseInt(b.student_roll));
    
    setFilteredStudents(filtered);
  };
  
  const calculateSummary = () => {
    const total = students.length;
    const present = Object.values(attendance).filter(status => status).length;
    const absent = total - present;
    const percentPresent = total > 0 ? Math.round((present / total) * 100) : 0;
    
    setSummary({
      total,
      present,
      absent,
      percentPresent
    });
  };
  
  const toggleAttendance = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };
  
  const formatDate = (date) => {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  };
  
  const openDatePicker = () => {
    setTempDate(new Date(selectedDate));
    setShowDateModal(true);
  };
  
  const applySelectedDate = () => {
    setSelectedDate(tempDate);
    setShowDateModal(false);
  };
  
  const generateDaysForMonth = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };
  
  const markAllPresent = () => {
    const newAttendance = {};
    students.forEach(student => {
      newAttendance[student.id] = true;
    });
    
    setAttendance(newAttendance);
  };
  
  const markAllAbsent = () => {
    const newAttendance = {};
    students.forEach(student => {
      newAttendance[student.id] = false;
    });
    
    setAttendance(newAttendance);
  };
  
  const submitAttendance = async () => {
    setIsSubmitting(true);
    
    try {
      const student_list = {};
      Object.entries(attendance).forEach(([studentId, isPresent]) => {
        student_list[studentId] = isPresent ? "P" : "A";
      });
      
      const requestData = {
        action: "make_att",
        att_date: selectedDate.toISOString().split('T')[0],
        student_list: student_list
      };
      
      console.log('Submitting attendance data:', requestData);
      
      const response = await axios.post(
        'https://abma.org.in/binex/api.php?task=make_att',
        requestData
      );
      
      if (response.data) {
        Alert.alert(
          'Mission Accomplished',
          `Attendance marked for ${selectedClass}-${selectedSection}.\n\nPresent: ${response.data.present}\nAbsent: ${response.data.absent}`,
          [{ text: 'ROGER' }]
        );
        
        setIsEditMode(false);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      Alert.alert(
        'Mission Failed',
        'There was an error submitting the attendance. Please try again.',
        [{ text: 'RETRY' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStudentItem = ({ item }) => {
    const isPresent = attendance[item.id];
    
    return (
      <View style={[
        styles.studentCard,
        isPresent ? styles.presentCard : styles.absentCard
      ]}>
        <View style={styles.statusStripe} />
        
        <View style={styles.studentInfo}>
          <View style={[
            styles.rollContainer,
            isPresent ? styles.presentRollContainer : styles.absentRollContainer
          ]}>
            <Text style={styles.rollNumber}>{item.student_roll}</Text>
          </View>
          
          <View style={styles.nameContainer}>
            <View style={styles.nameBadgeRow}>
              <View style={styles.nameBadge} />
              <Text style={styles.studentName}>{item.student_name}</Text>
            </View>
            <Text style={styles.admissionNumber}>CADET ID: {item.student_admission}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.attendanceToggle,
            isPresent ? styles.presentToggle : styles.absentToggle
          ]}
          onPress={() => toggleAttendance(item.id)}
          disabled={!isEditMode}
          activeOpacity={isEditMode ? 0.7 : 1}
        >
          <LinearGradient
            colors={isPresent ? [COLORS.success, '#22C55E'] : [COLORS.error, '#EF4444']}
            style={styles.toggleGradient}
          >
            {isPresent ? (
              <>
                <FontAwesome5 name="check-circle" size={16} color="#ffffff" />
                <Text style={styles.statusText}>PRESENT</Text>
              </>
            ) : (
              <>
                <FontAwesome5 name="times-circle" size={16} color="#ffffff" />
                <Text style={styles.statusText}>ABSENT</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.combat} />
      
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.combat, COLORS.primary, COLORS.secondary]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <FontAwesome5 name="arrow-left" size={20} color={COLORS.accent} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <FontAwesome5 name="shield-alt" size={20} color={COLORS.accent} />
              <Text style={styles.headerTitle}>ATTENDANCE LOG</Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.editButton,
                isEditMode ? styles.activeEditButton : {}
              ]}
              onPress={() => setIsEditMode(!isEditMode)}
            >
              <FontAwesome5 
                name={isEditMode ? "check" : "edit"} 
                size={18} 
                color={COLORS.accent} 
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
      
      {/* Class Selection Bar */}
      <View style={styles.classSelectionBar}>
        <View style={styles.classSelectionLeft}>
          <TouchableOpacity 
            style={styles.classSelector}
            onPress={() => setShowClassModal(true)}
          >
            <View style={styles.selectorBadge} />
            <View style={styles.selectorContent}>
              <Text style={styles.classSelectorLabel}>CLASS</Text>
              <View style={styles.classSelectorValue}>
                <Text style={styles.selectedValueText}>{selectedClass}</Text>
                <FontAwesome5 name="chevron-down" size={12} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.classSelector}
            onPress={() => setShowSectionModal(true)}
          >
            <View style={styles.selectorBadge} />
            <View style={styles.selectorContent}>
              <Text style={styles.classSelectorLabel}>SECTION</Text>
              <View style={styles.classSelectorValue}>
                <Text style={styles.selectedValueText}>{selectedSection}</Text>
                <FontAwesome5 name="chevron-down" size={12} color={COLORS.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.dateSelector}
          onPress={openDatePicker}
        >
          <FontAwesome5 name="calendar-alt" size={14} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.dateSelectorText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Toggle Summary Button */}
      <TouchableOpacity 
        style={styles.toggleSummaryButton}
        onPress={() => setShowSummary(!showSummary)}
      >
        <View style={styles.toggleSummaryLeft}>
          <View style={styles.toggleBadge} />
          <Text style={styles.toggleSummaryText}>
            {showSummary ? 'HIDE INTEL' : 'SHOW INTEL'}
          </Text>
        </View>
        <FontAwesome5 
          name={showSummary ? 'chevron-up' : 'chevron-down'} 
          size={14} 
          color={COLORS.primary} 
        />
      </TouchableOpacity>
      
      {/* Collapsible Summary Section */}
      {showSummary && (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.totalCard]}>
              <View style={styles.summaryIconContainer}>
                <FontAwesome5 name="users" size={18} color={COLORS.accent} />
              </View>
              <Text style={styles.summaryValue}>{summary.total}</Text>
              <Text style={styles.summaryLabel}>TOTAL</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.presentCard]}>
              <View style={styles.summaryIconContainer}>
                <FontAwesome5 name="check-circle" size={18} color={COLORS.success} />
              </View>
              <Text style={[styles.summaryValue, styles.presentValue]}>
                {summary.present}
              </Text>
              <Text style={styles.summaryLabel}>PRESENT</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.absentCardSummary]}>
              <View style={styles.summaryIconContainer}>
                <FontAwesome5 name="times-circle" size={18} color={COLORS.error} />
              </View>
              <Text style={[styles.summaryValue, styles.absentValue]}>
                {summary.absent}
              </Text>
              <Text style={styles.summaryLabel}>ABSENT</Text>
            </View>
            
            <View style={[styles.summaryCard, styles.percentCard]}>
              <View style={styles.summaryIconContainer}>
                <FontAwesome5 name="chart-pie" size={18} color={COLORS.accent} />
              </View>
              <Text style={[styles.summaryValue, styles.percentValue]}>
                {summary.percentPresent}%
              </Text>
              <Text style={styles.summaryLabel}>RATE</Text>
            </View>
          </View>
          
          {/* Filter and Action Row */}
          <View style={styles.actionRow}>
            <View style={styles.searchContainer}>
              <FontAwesome5 name="search" size={14} color={COLORS.gray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search operations..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.gray}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <FontAwesome5 name="times-circle" size={14} color={COLORS.gray} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>ABSENT</Text>
              <Switch
                value={showOnlyAbsent}
                onValueChange={setShowOnlyAbsent}
                trackColor={{ false: COLORS.sand, true: COLORS.accent }}
                thumbColor={showOnlyAbsent ? COLORS.accentLight : COLORS.white}
              />
            </View>
          </View>
          
          {/* Mark All Buttons */}
          {isEditMode && (
            <View style={styles.markAllContainer}>
              <TouchableOpacity 
                style={styles.markAllButton}
                onPress={markAllPresent}
              >
                <LinearGradient
                  colors={[COLORS.success, '#22C55E']}
                  style={styles.markAllGradient}
                >
                  <FontAwesome5 name="check-double" size={14} color="#ffffff" />
                  <Text style={styles.markAllText}>ALL PRESENT</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.markAllButton}
                onPress={markAllAbsent}
              >
                <LinearGradient
                  colors={[COLORS.error, '#EF4444']}
                  style={styles.markAllGradient}
                >
                  <FontAwesome5 name="times" size={14} color="#ffffff" />
                  <Text style={styles.markAllText}>ALL ABSENT</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
      
      {/* Student List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconContainer}>
            <FontAwesome5 name="shield-alt" size={50} color={COLORS.accent} />
          </View>
          <ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>LOADING ROSTER...</Text>
        </View>
      ) : filteredStudents.length > 0 ? (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.studentListContainer}
          showsVerticalScrollIndicator={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <FontAwesome5 name="user-graduate" size={60} color={COLORS.sand} />
          </View>
          <Text style={styles.emptyText}>NO CADETS FOUND</Text>
          <Text style={styles.emptySubtext}>All clear on roster</Text>
        </View>
      )}
      
      {/* Submit Button */}
      {isEditMode && (
        <View style={styles.submitButtonContainer}>
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={submitAttendance}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentLight]}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <FontAwesome5 name="shield-alt" size={20} color={COLORS.primary} />
                  <Text style={styles.submitButtonText}>SUBMIT ATTENDANCE</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Class Selection Modal */}
      <Modal
        visible={showClassModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowClassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[COLORS.secondary, COLORS.tertiary]}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalIconBadge}>
                  <FontAwesome5 name="school" size={18} color={COLORS.accent} />
                </View>
                <Text style={styles.modalTitle}>SELECT CLASS</Text>
              </View>
              <TouchableOpacity onPress={() => setShowClassModal(false)}>
                <FontAwesome5 name="times" size={20} color={COLORS.accent} />
              </TouchableOpacity>
            </LinearGradient>
            
            <ScrollView style={styles.modalContent}>
              {CLASS_OPTIONS.map(option => (
                <TouchableOpacity 
                  key={option.value}
                  style={[
                    styles.modalOption,
                    selectedClass === option.value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedClass(option.value);
                    setShowClassModal(false);
                  }}
                >
                  <View style={styles.modalOptionLeft}>
                    <View style={styles.optionBadge} />
                    <Text style={[
                      styles.modalOptionText,
                      selectedClass === option.value && styles.modalOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {selectedClass === option.value && (
                    <FontAwesome5 name="check-circle" size={18} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Section Selection Modal */}
      <Modal
        visible={showSectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[COLORS.secondary, COLORS.tertiary]}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalIconBadge}>
                  <FontAwesome5 name="layer-group" size={18} color={COLORS.accent} />
                </View>
                <Text style={styles.modalTitle}>SELECT SECTION</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSectionModal(false)}>
                <FontAwesome5 name="times" size={20} color={COLORS.accent} />
              </TouchableOpacity>
            </LinearGradient>
            
            <View style={styles.modalContent}>
              {SECTION_OPTIONS.map(option => (
                <TouchableOpacity 
                  key={option.value}
                  style={[
                    styles.modalOption,
                    selectedSection === option.value && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedSection(option.value);
                    setShowSectionModal(false);
                  }}
                >
                  <View style={styles.modalOptionLeft}>
                    <View style={styles.optionBadge} />
                    <Text style={[
                      styles.modalOptionText,
                      selectedSection === option.value && styles.modalOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {selectedSection === option.value && (
                    <FontAwesome5 name="check-circle" size={18} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Date Selection Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[COLORS.secondary, COLORS.tertiary]}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalIconBadge}>
                  <FontAwesome5 name="calendar-alt" size={18} color={COLORS.accent} />
                </View>
                <Text style={styles.modalTitle}>SELECT DATE</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <FontAwesome5 name="times" size={20} color={COLORS.accent} />
              </TouchableOpacity>
            </LinearGradient>
            
            <View style={styles.dateModalContent}>
              {/* Year and Month Selection */}
              <View style={styles.yearMonthSelection}>
                <View style={styles.yearSelector}>
                  <Text style={styles.yearMonthLabel}>YEAR</Text>
                  <View style={styles.yearPickerContainer}>
                    <TouchableOpacity 
                      style={styles.yearArrow}
                      onPress={() => {
                        const newDate = new Date(tempDate);
                        newDate.setFullYear(newDate.getFullYear() - 1);
                        setTempDate(newDate);
                      }}
                    >
                      <FontAwesome5 name="chevron-left" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    
                    <Text style={styles.yearValue}>{tempDate.getFullYear()}</Text>
                    
                    <TouchableOpacity 
                      style={styles.yearArrow}
                      onPress={() => {
                        const newDate = new Date(tempDate);
                        const newYear = newDate.getFullYear() + 1;
                        if (newYear <= new Date().getFullYear()) {
                          newDate.setFullYear(newYear);
                          setTempDate(newDate);
                        }
                      }}
                      disabled={tempDate.getFullYear() >= new Date().getFullYear()}
                    >
                      <FontAwesome5 
                        name="chevron-right" 
                        size={16} 
                        color={tempDate.getFullYear() >= new Date().getFullYear() ? COLORS.sand : COLORS.primary} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.monthSelector}>
                  <Text style={styles.yearMonthLabel}>MONTH</Text>
                  <View style={styles.monthPickerContainer}>
                    <TouchableOpacity 
                      style={styles.monthArrow}
                      onPress={() => {
                        const newDate = new Date(tempDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setTempDate(newDate);
                      }}
                    >
                      <FontAwesome5 name="chevron-left" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    
                    <Text style={styles.monthValue}>
                      {MONTHS[tempDate.getMonth()]}
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.monthArrow}
                      onPress={() => {
                        const newDate = new Date(tempDate);
                        const currentDate = new Date();
                        
                        if (
                          tempDate.getFullYear() < currentDate.getFullYear() ||
                          (tempDate.getFullYear() === currentDate.getFullYear() && 
                           tempDate.getMonth() < currentDate.getMonth())
                        ) {
                          newDate.setMonth(newDate.getMonth() + 1);
                          setTempDate(newDate);
                        }
                      }}
                      disabled={
                        tempDate.getFullYear() === new Date().getFullYear() && 
                        tempDate.getMonth() >= new Date().getMonth()
                      }
                    >
                      <FontAwesome5 
                        name="chevron-right" 
                        size={16} 
                        color={
                          tempDate.getFullYear() === new Date().getFullYear() && 
                          tempDate.getMonth() >= new Date().getMonth()
                            ? COLORS.sand 
                            : COLORS.primary
                        } 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              {/* Day Grid */}
              <View style={styles.dayGrid}>
                <View style={styles.weekdayHeader}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <Text key={index} style={styles.weekdayLabel}>{day}</Text>
                  ))}
                </View>
                
                <ScrollView style={styles.daysContainer}>
                  <View style={styles.daysGrid}>
                    {(() => {
                      const year = tempDate.getFullYear();
                      const month = tempDate.getMonth();
                      const daysInMonth = generateDaysForMonth(year, month);
                      const firstDayOfMonth = new Date(year, month, 1).getDay();
                      
                      const currentDate = new Date();
                      const dayElements = [];
                      
                      for (let i = 0; i < firstDayOfMonth; i++) {
                        dayElements.push(
                          <View key={`empty-${i}`} style={styles.emptyDay} />
                        );
                      }
                      
                      for (let day of daysInMonth) {
                        const date = new Date(year, month, day);
                        const isCurrentDate = date.getDate() === tempDate.getDate() &&
                                            date.getMonth() === tempDate.getMonth() &&
                                            date.getFullYear() === tempDate.getFullYear();
                        const isFutureDate = date > currentDate;
                        
                        dayElements.push(
                          <TouchableOpacity 
                            key={`day-${day}`}
                            style={[
                              styles.dayButton,
                              isCurrentDate && styles.selectedDayButton,
                              isFutureDate && styles.disabledDayButton
                            ]}
                            onPress={() => {
                              if (!isFutureDate) {
                                const newDate = new Date(tempDate);
                                newDate.setDate(day);
                                setTempDate(newDate);
                              }
                            }}
                            disabled={isFutureDate}
                          >
                            <Text style={[
                              styles.dayText,
                              isCurrentDate && styles.selectedDayText,
                              isFutureDate && styles.disabledDayText
                            ]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                      
                      return dayElements;
                    })()}
                  </View>
                </ScrollView>
              </View>
              
              {/* Date picker footer */}
              <View style={styles.datePickerFooter}>
                <TouchableOpacity 
                  style={styles.cancelDateButton}
                  onPress={() => setShowDateModal(false)}
                >
                  <Text style={styles.cancelDateText}>CANCEL</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.applyDateButton}
                  onPress={applySelectedDate}
                >
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentLight]}
                    style={styles.applyDateGradient}
                  >
                    <Text style={styles.applyDateText}>APPLY</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 75,
    width: '100%',
  },
  headerGradient: {
    flex: 1,
    paddingTop: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.accent,
    letterSpacing: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  activeEditButton: {
    backgroundColor: 'rgba(22, 163, 74, 0.3)',
  },
  classSelectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 2,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.sand,
  },
  classSelectionLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  classSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorBadge: {
    width: 4,
    height: 32,
    backgroundColor: COLORS.accent,
  },
  selectorContent: {
    justifyContent: 'center',
  },
  classSelectorLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  classSelectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedValueText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  dateSelectorText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggleSummaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.sand,
    backgroundColor: COLORS.white,
  },
  toggleSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleBadge: {
    width: 4,
    height: 16,
    backgroundColor: COLORS.accent,
  },
  toggleSummaryText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
  },
  totalCard: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.sand,
  },
  presentCard: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderColor: COLORS.success,
  },
  absentCardSummary: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: COLORS.error,
  },
  percentCard: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.accent,
  },
  summaryIconContainer: {
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  presentValue: {
    color: COLORS.success,
  },
  absentValue: {
    color: COLORS.error,
  },
  percentValue: {
    color: COLORS.accent,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.gray,
    fontWeight: '800',
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary,
    padding: 0,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  markAllContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.sand,
    gap: 12,
  },
  markAllButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
  },
  markAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  studentListContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.sand,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '600',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  presentCard: {
    borderColor: COLORS.success,
  },
  absentCard: {
    borderColor: COLORS.error,
  },
  statusStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: COLORS.accent,
  },
  studentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  rollContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
  },
  presentRollContainer: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    borderColor: COLORS.success,
  },
  absentRollContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderColor: COLORS.error,
  },
  rollNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  nameContainer: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  nameBadge: {
    width: 3,
    height: 14,
    backgroundColor: COLORS.accent,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  admissionNumber: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  attendanceToggle: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 1,
  },
  submitButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  submitButtonText: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: COLORS.offWhite,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.accent,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
  },
  modalContent: {
    maxHeight: '70%',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sand,
  },
  modalOptionSelected: {
    backgroundColor: COLORS.background,
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionBadge: {
    width: 4,
    height: 18,
    backgroundColor: COLORS.accent,
  },
  modalOptionText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalOptionTextSelected: {
    fontWeight: '900',
    color: COLORS.primary,
  },
  // Date Picker Modal Styles
  dateModalContent: {
    padding: 20,
  },
  yearMonthSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  yearSelector: {
    flex: 1,
  },
  monthSelector: {
    flex: 1,
  },
  yearMonthLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginBottom: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  yearPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  monthPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: COLORS.sand,
  },
  yearArrow: {
    padding: 4,
  },
  monthArrow: {
    padding: 4,
  },
  yearValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  monthValue: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
    flex: 1,
    textAlign: 'center',
    letterSpacing: 1,
  },
  dayGrid: {
    marginBottom: 20,
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weekdayLabel: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  daysContainer: {
    maxHeight: 250,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
  },
  dayButton: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedDayButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 8,
  },
  disabledDayButton: {
    opacity: 0.3,
  },
  emptyDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  dayText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectedDayText: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  disabledDayText: {
    color: COLORS.gray,
  },
  datePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 2,
    borderTopColor: COLORS.sand,
    paddingTop: 16,
    gap: 12,
  },
  cancelDateButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelDateText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '800',
    letterSpacing: 1,
  },
  applyDateButton: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  applyDateGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  applyDateText: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
});