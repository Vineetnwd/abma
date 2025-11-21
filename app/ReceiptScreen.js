import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

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

export default function ReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState(null);

  const receiptId = params.receipt_no || params.receipt_id || "";

  const schoolDetails = {
    name: "Delhi Public School, Mushkipur",
    address: "Mushkipur, Muzaffarpur, Bihar - 842002",
    phone: "+91 9876543210",
    email: "info@dpsmushkipur.com",
    website: "www.dpsmushkipur.com",
    logo: require("./assets/logo.png")
  };

  useEffect(() => {
    fetchReceiptDetails();
  }, [receiptId]);

  const fetchReceiptDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!receiptId) {
        throw new Error("Receipt ID is required");
      }

      const response = await axios.post(
        'https://abma.org.in/binex/api.php?task=get_receipt',
        {
          receipt_id: receiptId
        }
      );
      
      if (response.data) {
        setReceiptData(response.data);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error fetching receipt:", err);
      setError("Failed to load receipt details. " + (err.message || ""));
    } finally {
      setIsLoading(false);
    }
  };

  const generateReceiptHTML = () => {
    if (!receiptData) return '';

    const formattedDate = new Date(receiptData.payment_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const paidAmount = receiptData.paid_amount !== null ? receiptData.paid_amount : receiptData.total;
    const paidMonths = Array.isArray(receiptData.paid_month)
      ? receiptData.paid_month
      : (receiptData.paid_month || "").split(',').map(m => m.trim());

    return `
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #2C2C2C;
            background-color: #F5F3EE;
          }
          .receipt {
            max-width: 800px;
            margin: 0 auto;
            border: 3px solid ${COLORS.primary};
            border-radius: 10px;
            overflow: hidden;
            background-color: white;
          }
          .header {
            background: linear-gradient(135deg, ${COLORS.dark}, ${COLORS.primary}, ${COLORS.secondary});
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 4px solid ${COLORS.accent};
          }
          .school-info {
            flex: 1;
          }
          .school-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            letter-spacing: 1px;
          }
          .school-details {
            font-size: 12px;
            margin-top: 5px;
          }
          .receipt-title {
            font-size: 28px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            color: ${COLORS.primary};
            letter-spacing: 3px;
            text-transform: uppercase;
            border-bottom: 3px solid ${COLORS.accent};
            padding-bottom: 10px;
          }
          .receipt-no {
            text-align: right;
            font-size: 14px;
            margin-bottom: 5px;
            font-weight: bold;
            color: ${COLORS.textPrimary};
          }
          .content {
            padding: 20px;
          }
          .section {
            margin-bottom: 25px;
            border: 2px solid ${COLORS.borderLight};
            border-radius: 8px;
            padding: 15px;
            background-color: ${COLORS.cardBg};
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            border-bottom: 2px solid ${COLORS.border};
            padding-bottom: 8px;
            margin-bottom: 12px;
            color: ${COLORS.primary};
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px;
            background-color: white;
            border-radius: 4px;
          }
          .info-label {
            font-weight: bold;
            color: ${COLORS.textSecondary};
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          table, th, td {
            border: 2px solid ${COLORS.border};
          }
          th {
            background-color: ${COLORS.primary};
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          td {
            padding: 10px;
            background-color: white;
          }
          .payment-summary {
            background-color: ${COLORS.background};
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            border: 3px solid ${COLORS.primary};
            border-left-width: 6px;
          }
          .total-row {
            font-weight: bold;
            font-size: 18px;
            color: ${COLORS.primary};
            padding: 10px;
            background-color: ${COLORS.accent}30;
            border-radius: 4px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px dashed ${COLORS.border};
            font-size: 12px;
            color: ${COLORS.textSecondary};
          }
          .signature {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            text-align: center;
            width: 40%;
          }
          .signature-line {
            border-top: 2px solid ${COLORS.dark};
            margin-bottom: 8px;
          }
          .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 120px;
            color: rgba(74, 93, 35, 0.08);
            z-index: -1;
            font-weight: bold;
            letter-spacing: 10px;
          }
          .dues-notice {
            margin-top: 15px;
            padding: 15px;
            background-color: #FFF3E0;
            border-radius: 8px;
            border-left: 4px solid ${COLORS.warning};
          }
          .badge {
            display: inline-block;
            padding: 5px 12px;
            background-color: ${COLORS.success};
            color: white;
            border-radius: 4px;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 1px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="school-info">
              <div class="school-name">${schoolDetails.name}</div>
              <div class="school-details">${schoolDetails.address}</div>
              <div class="school-details">Phone: ${schoolDetails.phone} | Email: ${schoolDetails.email}</div>
            </div>
          </div>
          
          <div class="content">
            <div class="receipt-title">Fee Receipt</div>
            <div class="receipt-no">Receipt No: <span class="badge">#${receiptData.receipt_id}</span></div>
            <div class="receipt-no">Date: ${formattedDate}</div>
            
            <div class="section">
              <div class="section-title">Student Information</div>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span>${receiptData.student_name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Admission No:</span>
                <span>${receiptData.admission_no}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Class:</span>
                <span>${receiptData.student_class}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Father's Name:</span>
                <span>${receiptData.father_name}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Fee Details</div>
              <table>
                <tr>
                  <th>Description</th>
                  <th>Amount (₹)</th>
                </tr>
                <tr>
                  <td>${paidMonths.join(', ')} - Tuition Fee</td>
                  <td>₹ ${parseFloat(receiptData.fee_details.tution_fee).toLocaleString()}</td>
                </tr>
                ${receiptData.fee_details.transport_fee ? `
                <tr>
                  <td>${paidMonths.join(', ')} - Transport Fee</td>
                  <td>₹ ${parseFloat(receiptData.fee_details.transport_fee).toLocaleString()}</td>
                </tr>
                ` : ''}
              </table>
              
              <div class="payment-summary">
                <div class="info-row">
                  <span class="info-label">Total Amount:</span>
                  <span>₹ ${parseFloat(receiptData.total).toLocaleString()}</span>
                </div>
                ${parseFloat(receiptData.discount) > 0 ? `
                <div class="info-row">
                  <span class="info-label">Discount:</span>
                  <span style="color: ${COLORS.error};">- ₹ ${parseFloat(receiptData.discount).toLocaleString()}</span>
                </div>
                ` : ''}
                ${parseFloat(receiptData.misc_fee) > 0 ? `
                <div class="info-row">
                  <span class="info-label">Misc Fee:</span>
                  <span style="color: ${COLORS.success};">+ ₹ ${parseFloat(receiptData.misc_fee).toLocaleString()}</span>
                </div>
                ` : ''}
                <div class="info-row total-row">
                  <span class="info-label">Amount Paid:</span>
                  <span>₹ ${parseFloat(paidAmount).toLocaleString()}</span>
                </div>
                ${parseFloat(receiptData.current_dues) > 0 ? `
                <div class="dues-notice">
                  <div class="info-row" style="background: transparent;">
                    <span class="info-label">Current Dues:</span>
                    <span style="font-weight: bold; color: ${COLORS.warning};">₹ ${parseFloat(receiptData.current_dues).toLocaleString()}</span>
                  </div>
                </div>
                ` : ''}
              </div>
              ${receiptData.remarks ? `
              <div style="margin-top: 15px; padding: 10px; background-color: #FFF3E0; border-radius: 4px;">
                <span class="info-label">Remarks:</span>
                <p style="margin: 5px 0 0 0;">${receiptData.remarks}</p>
              </div>
              ` : ''}
            </div>
            
            <div class="signature">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div style="font-weight: bold; text-transform: uppercase;">Parent's Signature</div>
              </div>
              
              <div class="signature-box">
                <div class="signature-line"></div>
                <div style="font-weight: bold; text-transform: uppercase;">Authorized Signatory</div>
                <div style="color: ${COLORS.primary}; font-weight: bold;">ABMA</div>
              </div>
            </div>
            
            <div class="footer">
              <p style="font-weight: bold;">This is a computer-generated receipt and does not require a physical signature.</p>
              <p>For any queries, please contact the school office.</p>
            </div>
          </div>
        </div>
        
        <div class="watermark">PAID</div>
      </body>
      </html>
    `;
  };

  const printReceipt = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const html = generateReceiptHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert("Sharing not available", "Sharing is not available on this device.");
      }
    } catch (error) {
      console.error("Error printing receipt:", error);
      Alert.alert("Print Error", "There was an error while generating the receipt.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.logoCircle}>
          <FontAwesome5 name="receipt" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.loadingText}>LOADING RECEIPT...</Text>
        <View style={styles.loadingBadge}>
          <Text style={styles.loadingBadgeText}>TACTICAL LOADING</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.errorIconContainer}>
          <FontAwesome5 name="exclamation-triangle" size={50} color={COLORS.error} />
        </View>
        <Text style={styles.errorTitle}>ERROR LOADING RECEIPT</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchReceiptDetails}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.retryButtonGradient}
          >
            <View style={styles.buttonStripe} />
            <Text style={styles.retryButtonText}>RETRY</Text>
            <FontAwesome5 name="redo" size={16} color={COLORS.white} style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const paidAmount = receiptData.paid_amount !== null ? 
                     parseFloat(receiptData.paid_amount) : 
                     parseFloat(receiptData.total);

  const isPartialPayment = receiptData.paid_amount !== null && 
                          parseFloat(receiptData.paid_amount) < parseFloat(receiptData.total);

  const paidMonths = Array.isArray(receiptData.paid_month)
    ? receiptData.paid_month
    : (receiptData.paid_month || "").split(',').map(m => m.trim());

  const hasDues = receiptData.current_dues && parseFloat(receiptData.current_dues) > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      
      {/* Watermark */}
      <View style={styles.watermark}>
        <Text style={styles.watermarkText}>PAID</Text>
      </View>
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.dark, COLORS.primary, COLORS.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/Dashboard')}
        >
          <FontAwesome5 name="arrow-left" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>FEE RECEIPT</Text>
          <View style={styles.headerUnderline} />
        </View>
        <TouchableOpacity 
          style={styles.printButton}
          onPress={printReceipt}
        >
          <FontAwesome5 name="print" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </LinearGradient>
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt Card */}
        <Animated.View 
          entering={FadeIn.delay(200).springify()}
          style={styles.receiptCard}
        >
          {/* School Info */}
          <LinearGradient
            colors={[COLORS.dark, COLORS.primary]}
            style={styles.schoolHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.logoContainer}>
              <Image 
                source={schoolDetails.logo}
                style={styles.schoolLogo}
                defaultSource={require('./assets/default.png')}
              />
              <View style={styles.logoBadge}>
                <View style={styles.logoDot} />
              </View>
            </View>
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{schoolDetails.name}</Text>
              <Text style={styles.schoolAddress}>{schoolDetails.address}</Text>
            </View>
          </LinearGradient>
          
          {/* Receipt Title */}
          <View style={styles.receiptTitleContainer}>
            <View style={styles.receiptBadge}>
              <View style={styles.badgeStripe} />
              <Text style={styles.receiptTitle}>RECEIPT</Text>
              <View style={styles.badgeDot} />
            </View>
            <View style={styles.receiptMeta}>
              <View style={styles.metaItem}>
                <View style={styles.metaDot} />
                <Text style={styles.receiptNo}>#{receiptData.receipt_id}</Text>
              </View>
              <View style={styles.metaItem}>
                <FontAwesome5 name="calendar-alt" size={12} color={COLORS.textSecondary} />
                <Text style={styles.receiptDate}>
                  {new Date(receiptData.payment_date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Student Information */}
          <Animated.View 
            entering={SlideInDown.delay(300).springify()}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <FontAwesome5 name="user-graduate" size={16} color={COLORS.primary} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>STUDENT INFORMATION</Text>
                <View style={styles.sectionUnderline} />
              </View>
            </View>
            
            <View style={styles.studentDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <View style={styles.detailDot} />
                  <Text style={styles.detailLabel}>NAME</Text>
                </View>
                <Text style={styles.detailValue}>{receiptData.student_name}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <View style={styles.detailDot} />
                  <Text style={styles.detailLabel}>ADMISSION NO.</Text>
                </View>
                <Text style={styles.detailValue}>{receiptData.admission_no}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <View style={styles.detailDot} />
                  <Text style={styles.detailLabel}>CLASS</Text>
                </View>
                <Text style={styles.detailValue}>{receiptData.student_class}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <View style={styles.detailDot} />
                  <Text style={styles.detailLabel}>FATHER'S NAME</Text>
                </View>
                <Text style={styles.detailValue}>{receiptData.father_name}</Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Payment Details */}
          <Animated.View 
            entering={SlideInDown.delay(400).springify()}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <FontAwesome5 name="money-check-alt" size={16} color={COLORS.primary} />
              </View>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
                <View style={styles.sectionUnderline} />
              </View>
            </View>
            
            <View style={styles.paymentDetails}>
              <View style={styles.paymentRow}>
                <View style={styles.paymentInfo}>
                  <View style={styles.paymentIconContainer}>
                    <FontAwesome5 
                      name="calendar-alt" 
                      size={16} 
                      color={COLORS.primary} 
                    />
                  </View>
                  <View>
                    <Text style={styles.paymentMethod}>
                      {paidMonths.length > 1 ? `${paidMonths.join(', ')} FEES` : `${paidMonths[0]} FEE`}
                    </Text>
                    <Text style={styles.paymentDate}>
                      Paid on {new Date(receiptData.payment_date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>PAID AMOUNT</Text>
                  <Text style={styles.amountValue}>₹{paidAmount.toLocaleString()}</Text>
                  
                  {isPartialPayment && (
                    <View style={styles.partialPaymentBadge}>
                      <Text style={styles.partialPayment}>PARTIAL</Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.feeBreakdown}>
                <View style={styles.breakdownTitleContainer}>
                  <View style={styles.breakdownDot} />
                  <Text style={styles.breakdownTitle}>FEE BREAKDOWN</Text>
                </View>

                {receiptData?.fee_details?.tution_fee ? (
                  <View style={styles.feeRow}>
                    <View style={styles.feeLabelContainer}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.feeLabel}>TUITION FEE</Text>
                    </View>
                    <Text style={styles.feeValue}>
                      ₹{Number(receiptData.fee_details.tution_fee).toLocaleString("en-IN")}
                    </Text>
                  </View>
                ) : null}

                {receiptData?.fee_details?.transport_fee !== undefined &&
                receiptData?.fee_details?.transport_fee !== null && (
                  <View style={styles.feeRow}>
                    <View style={styles.feeLabelContainer}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.feeLabel}>TRANSPORT FEE</Text>
                    </View>
                    <Text style={styles.feeValue}>
                      ₹{Number(receiptData.fee_details.transport_fee).toLocaleString("en-IN")}
                    </Text>
                  </View>
                )}

                {receiptData?.fee_details?.total !== undefined &&
                receiptData?.fee_details?.total !== null && (
                  <View style={[styles.feeRow, styles.totalRow]}>
                    <View style={styles.feeLabelContainer}>
                      <View style={[styles.bulletDot, { backgroundColor: COLORS.primary }]} />
                      <Text style={styles.totalLabel}>TOTAL</Text>
                    </View>
                    <Text style={styles.totalValue}>
                      ₹{Number(receiptData.fee_details.total).toLocaleString("en-IN")}
                    </Text>
                  </View>
                )}
                
                {Number(receiptData?.discount) > 0 && (
                  <View style={styles.feeRow}>
                    <View style={styles.feeLabelContainer}>
                      <View style={[styles.bulletDot, { backgroundColor: COLORS.error }]} />
                      <Text style={styles.feeLabel}>DISCOUNT</Text>
                    </View>
                    <Text style={styles.discountValue}>
                      - ₹{Number(receiptData.discount).toLocaleString("en-IN")}
                    </Text>
                  </View>
                )}
                
                {Number(receiptData?.misc_fee) > 0 && (
                  <View style={styles.feeRow}>
                    <View style={styles.feeLabelContainer}>
                      <View style={[styles.bulletDot, { backgroundColor: COLORS.success }]} />
                      <Text style={styles.feeLabel}>MISC. FEE</Text>
                    </View>
                    <Text style={styles.miscValue}>
                      + ₹{Number(receiptData.misc_fee).toLocaleString("en-IN")}
                    </Text>
                  </View>
                )}

                <View style={[styles.feeRow, styles.netAmountRow]}>
                  <View style={styles.netAmountStripe} />
                  <View style={styles.feeLabelContainer}>
                    <View style={[styles.bulletDot, { backgroundColor: COLORS.accent }]} />
                    <Text style={styles.netAmountLabel}>NET AMOUNT</Text>
                  </View>
                  <Text style={styles.netAmountValue}>
                    ₹{parseFloat(receiptData.total).toLocaleString()}
                  </Text>
                </View>
                
                {hasDues && (
                  <View style={styles.duesContainer}>
                    <View style={styles.duesStripe} />
                    <View style={styles.duesHeader}>
                      <View style={styles.duesIconContainer}>
                        <FontAwesome5 name="exclamation-triangle" size={14} color={COLORS.warning} />
                      </View>
                      <Text style={styles.duesTitle}>CURRENT DUES</Text>
                    </View>
                    <Text style={styles.duesAmount}>
                      ₹{parseFloat(receiptData.current_dues).toLocaleString()}
                    </Text>
                  </View>
                )}
                
                {receiptData.remarks && (
                  <View style={styles.remarksContainer}>
                    <View style={styles.remarksStripe} />
                    <View style={styles.remarksHeader}>
                      <FontAwesome5 name="comment-alt" size={12} color={COLORS.textSecondary} />
                      <Text style={styles.remarksLabel}>REMARKS</Text>
                    </View>
                    <Text style={styles.remarksText}>{receiptData.remarks}</Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
          
          {/* Verification */}
          <Animated.View 
            entering={SlideInDown.delay(500).springify()}
            style={[styles.section, styles.verificationSection]}
          >
            <View style={styles.qrContainer}>
              <View style={styles.qrPlaceholder}>
                <FontAwesome5 name="qrcode" size={60} color={COLORS.border} />
              </View>
              <Text style={styles.scanText}>SCAN TO VERIFY</Text>
            </View>
            
            <View style={styles.signatureContainer}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>AUTHORIZED SIGNATORY</Text>
              <Text style={styles.signaturePosition}>ABMA</Text>
            </View>
          </Animated.View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerStripe} />
            <Text style={styles.footerText}>
              THIS IS A COMPUTER-GENERATED RECEIPT
            </Text>
            <Text style={styles.footerText}>
              For queries, contact the school office
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.shareButton]}
          onPress={printReceipt}
        >
          <LinearGradient
            colors={[COLORS.accent, '#A89063']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.buttonStripe} />
            <FontAwesome5 name="share-alt" size={18} color={COLORS.dark} />
            <Text style={styles.buttonText}>SHARE</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/Dashboard')}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.buttonStripe} />
            <Text style={styles.doneButtonText}>DONE</Text>
            <FontAwesome5 name="check" size={16} color={COLORS.white} style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
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
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
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
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  watermarkText: {
    fontSize: 120,
    color: 'rgba(74, 93, 35, 0.05)',
    fontWeight: 'bold',
    transform: [{ rotate: '-45deg' }],
    letterSpacing: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
  printButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  receiptCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: COLORS.border,
  },
  schoolHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.accent,
  },
  logoContainer: {
    position: 'relative',
    marginRight: 16,
  },
  schoolLogo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  logoBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  schoolAddress: {
    color: COLORS.white,
    fontSize: 11,
    opacity: 0.95,
    fontWeight: '500',
  },
  receiptTitleContainer: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: COLORS.dark,
  },
  badgeStripe: {
    width: 3,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
  },
  receiptTitle: {
    fontSize: 18,
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
  receiptMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  receiptNo: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  receiptDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  sectionUnderline: {
    width: 30,
    height: 3,
    backgroundColor: COLORS.accent,
    marginTop: 4,
  },
  studentDetails: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  paymentDetails: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  paymentRow: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
  },
  paymentMethod: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  paymentDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  partialPaymentBadge: {
    marginTop: 6,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.dark,
  },
  partialPayment: {
    fontSize: 9,
    color: COLORS.white,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  divider: {
    height: 2,
    backgroundColor: COLORS.border,
  },
  feeBreakdown: {
    padding: 16,
  },
  breakdownTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  breakdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  feeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  feeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  feeValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: COLORS.primary + '10',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  discountValue: {
    fontSize: 13,
    color: COLORS.error,
    fontWeight: '700',
  },
  miscValue: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '700',
  },
  netAmountRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.accent + '20',
    borderWidth: 2,
    borderColor: COLORS.accent,
    position: 'relative',
  },
  netAmountStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.accent,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  netAmountLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  netAmountValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  duesContainer: {
    marginTop: 16,
    padding: 14,
    backgroundColor: COLORS.warning + '15',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.warning + '40',
    position: 'relative',
  },
  duesStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.warning,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  duesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  duesIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.warning + '30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.warning + '50',
  },
  duesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
    letterSpacing: 0.8,
  },
  duesAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.warning,
    letterSpacing: 0.5,
  },
  remarksContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.borderLight,
    borderRadius: 6,
    position: 'relative',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  remarksStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: COLORS.textSecondary,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  remarksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  remarksLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  remarksText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  verificationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  scanText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  signatureContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  signatureLine: {
    width: 120,
    height: 2,
    backgroundColor: COLORS.dark,
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.8,
  },
  signaturePosition: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  footerStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.accent,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 12,
    borderTopWidth: 3,
    borderTopColor: COLORS.primary,
  },
  actionButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  shareButton: {
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: COLORS.dark,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1.2,
  },
  doneButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1.2,
  },
});