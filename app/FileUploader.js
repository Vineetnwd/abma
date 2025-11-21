import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
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
};

const FileUploader = ({
  onUploadSuccess,
  onUploadError,
  buttonTitle = "UPLOAD FILE",
  apiUrl = "https://abma.org.in/binex/api.php?task=upload",
  maxSize = 5 * 1024 * 1024, // 5MB
  allowedTypes = ["jpg", "jpeg", "png", "gif", "pdf"],
  theme = COLORS,
  style = {},
}) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  const abortControllerRef = useRef(null);
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };
  
  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showErrorMessage('Media library permissions are needed to select images');
      return false;
    }
    return true;
  };

  const showErrorMessage = (message) => {
    setUploadStatus('error');
    setStatusMessage(message);
    setTimeout(() => {
      setUploadStatus(null);
      setStatusMessage('');
    }, 3000);
  };

  const showSuccessMessage = (message) => {
    setUploadStatus('success');
    setStatusMessage(message);
    setTimeout(() => {
      setUploadStatus(null);
      setStatusMessage('');
    }, 3000);
  };

  const pickDocument = async () => {
    try {
      setShowOptions(false);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return null;
      
      const file = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      
      const fileObj = {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
        size: fileInfo.size || file.size,
        isImage: file.mimeType.startsWith('image/'),
      };
      
      setSelectedFile(fileObj);
      setShowPreview(true);
      
      return file;
    } catch (err) {
      console.error('Error picking document:', err);
      showErrorMessage('Failed to select document');
      return null;
    }
  };

  const pickImage = async () => {
    try {
      setShowOptions(false);
      const hasPermission = await requestMediaLibraryPermissions();
      if (!hasPermission) return null;
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return null;
      
      const image = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(image.uri);
      
      const fileObj = {
        uri: image.uri,
        name: image.uri.split('/').pop(),
        type: 'image/' + image.uri.split('.').pop().toLowerCase(),
        size: fileInfo.size,
        width: image.width,
        height: image.height,
        isImage: true,
      };
      
      setSelectedFile(fileObj);
      setShowPreview(true);
      
      return image;
    } catch (err) {
      console.error('Error picking image:', err);
      showErrorMessage('Failed to select image');
      return null;
    }
  };

  const takePicture = async () => {
    try {
      setShowOptions(false);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showErrorMessage('Camera permissions are needed to take pictures');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (result.canceled) return;
      
      const image = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(image.uri);
      
      const fileObj = {
        uri: image.uri,
        name: `photo_${new Date().getTime()}.jpg`,
        type: 'image/jpeg',
        size: fileInfo.size,
        width: image.width,
        height: image.height,
        isImage: true,
      };
      
      setSelectedFile(fileObj);
      setShowPreview(true);
    } catch (err) {
      console.error('Error taking picture:', err);
      showErrorMessage('Failed to take picture');
    }
  };

  const processImage = async () => {
    if (!selectedFile || !selectedFile.isImage) return selectedFile;
    
    try {
      const manipResult = await manipulateAsync(
        selectedFile.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      
      const fileInfo = await FileSystem.getInfoAsync(manipResult.uri);
      
      return {
        ...selectedFile,
        uri: manipResult.uri,
        size: fileInfo.size,
        type: 'image/jpeg',
        name: selectedFile.name.split('.')[0] + '.jpg',
      };
    } catch (error) {
      console.error('Error processing image:', error);
      return selectedFile;
    }
  };

  const validateFile = (file) => {
    if (file.size > maxSize) {
      showErrorMessage(`File too large. Maximum size is ${formatFileSize(maxSize)}`);
      return false;
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      showErrorMessage(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const handleUpload = async () => {
    setShowPreview(false);
    
    if (!selectedFile) {
      showErrorMessage('No file selected');
      return;
    }
    
    const processedFile = selectedFile.isImage ? await processImage() : selectedFile;
    
    if (!validateFile(processedFile)) {
      return;
    }
    
    uploadFile(processedFile);
  };

  const uploadFile = async (file) => {
    try {
      setLoading(true);
      setProgress(0);
      
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        name: file.name,
        type: file.type,
      });

      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progressValue = event.loaded / event.total;
          setProgress(progressValue);
        }
      });
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (e) {
                reject(new Error('Invalid response from server'));
              }
            } else {
              reject(new Error(`HTTP Error: ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error occurred'));
        xhr.ontimeout = () => reject(new Error('Upload timed out'));
      });
      
      xhr.open('POST', apiUrl, true);
      xhr.send(formData);
      
      signal.addEventListener('abort', () => {
        xhr.abort();
      });
      
      const responseData = await uploadPromise;
      
      if (responseData.success) {
        showSuccessMessage(`File uploaded successfully`);
        if (onUploadSuccess) onUploadSuccess(responseData);
      } else {
        showErrorMessage(responseData.error || "Upload failed");
        if (onUploadError) onUploadError(responseData.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showErrorMessage(error.message || "An unexpected error occurred");
      if (onUploadError) onUploadError(error.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setProgress(0);
    showErrorMessage('Upload cancelled');
  };

  const renderFileIcon = () => {
    if (!selectedFile) return null;
    
    if (selectedFile.isImage) {
      return (
        <Image 
          source={{ uri: selectedFile.uri }}
          style={styles.previewImage}
          resizeMode="contain"
        />
      );
    } else {
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      
      if (extension === 'pdf') {
        return (
          <View style={styles.fileIconContainer}>
            <FontAwesome5 name="file-pdf" size={80} color={COLORS.error} />
          </View>
        );
      } else {
        return (
          <View style={styles.fileIconContainer}>
            <FontAwesome5 name="file-alt" size={80} color={COLORS.primary} />
          </View>
        );
      }
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Main upload button */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: COLORS.primary }]}
        onPress={() => setShowOptions(true)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.accent} size="small" />
        ) : (
          <>
            <Text style={styles.buttonText}>{buttonTitle}</Text>
            <Ionicons name="cloud-upload-outline" size={22} color={COLORS.accent} style={styles.buttonIcon} />
          </>
        )}
      </TouchableOpacity>
      
      {/* Upload progress */}
      {loading && (
        <View style={styles.progressSection}>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${progress * 100}%`,
                  backgroundColor: COLORS.success
                }
              ]} 
            />
          </View>
          <View style={styles.progressDetails}>
            <Text style={styles.progressText}>{Math.round(progress * 100)}% COMPLETE</Text>
            <TouchableOpacity onPress={cancelUpload}>
              <Text style={[styles.cancelText, { color: COLORS.error }]}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Status message */}
      {uploadStatus && (
        <View style={[
          styles.statusContainer, 
          { 
            backgroundColor: uploadStatus === 'success' 
              ? `${COLORS.success}15` 
              : `${COLORS.error}15`,
            borderColor: uploadStatus === 'success' 
              ? COLORS.success 
              : COLORS.error,
          }
        ]}>
          <Ionicons 
            name={uploadStatus === 'success' ? 'checkmark-circle' : 'alert-circle'} 
            size={22} 
            color={uploadStatus === 'success' ? COLORS.success : COLORS.error} 
          />
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      )}
      
      {/* File options modal */}
      <Modal
        visible={showOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsContainer}>
            <View style={styles.optionsHandle} />
            <Text style={styles.optionsTitle}>UPLOAD FILE</Text>
            
            <TouchableOpacity style={styles.optionButton} onPress={pickDocument}>
              <View style={[styles.optionIconBg, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="document-text" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>DOCUMENT</Text>
                <Text style={styles.optionSubtext}>PDF, Images</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={COLORS.border} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionButton} onPress={pickImage}>
              <View style={[styles.optionIconBg, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="images" size={24} color={COLORS.success} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>GALLERY</Text>
                <Text style={styles.optionSubtext}>Choose from your photos</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={COLORS.border} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionButton} onPress={takePicture}>
              <View style={[styles.optionIconBg, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="camera" size={24} color={COLORS.warning} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionText}>CAMERA</Text>
                <Text style={styles.optionSubtext}>Take a new photo</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={COLORS.border} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* File preview modal */}
      <Modal
        visible={showPreview}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>FILE PREVIEW</Text>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Ionicons name="close" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.previewContent}>
            {renderFileIcon()}
            
            {selectedFile && (
              <View style={styles.fileInfoContainer}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileInfo}>
                  {selectedFile.type} · {formatFileSize(selectedFile.size)}
                </Text>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.previewActions}>
            <TouchableOpacity 
              style={[styles.previewButton, { backgroundColor: COLORS.error }]} 
              onPress={() => {
                setShowPreview(false);
                setSelectedFile(null);
              }}
            >
              <Text style={styles.previewButtonText}>CANCEL</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.previewButton, { backgroundColor: COLORS.primary }]} 
              onPress={handleUpload}
            >
              <Text style={styles.previewButtonText}>UPLOAD</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  buttonText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
  buttonIcon: {
    marginLeft: 8,
  },
  // Progress section
  progressSection: {
    marginTop: 16,
    width: '100%',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  // Status message
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  statusText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 62, 35, 0.85)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 15,
  },
  optionsHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '60',
  },
  optionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  optionSubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
    fontWeight: '500',
  },
  cancelButton: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  cancelButtonText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Preview modal
  previewContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent + '40',
    backgroundColor: COLORS.cardBg,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  previewContent: {
    flex: 1,
    padding: 20,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  fileIconContainer: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border + '40',
  },
  fileInfoContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    borderWidth: 1,
    borderColor: COLORS.border + '30',
  },
  fileName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  fileInfo: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '600',
  },
  previewActions: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: COLORS.lightGray + '60',
    padding: 16,
    backgroundColor: COLORS.cardBg,
  },
  previewButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  previewButtonText: {
    color: COLORS.accent,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
});
