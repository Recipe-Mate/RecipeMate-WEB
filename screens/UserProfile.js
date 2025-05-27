import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const UserProfile = ({ navigation }) => {
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE}?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('네트워크 응답이 올바르지 않습니다');
      }
      
      const userData = await response.json();
      setUser(userData);
      setNewName(userData.name || '');
      setProfileImage(userData.profileImage || null);
    } catch (error) {
      console.error('사용자 프로필 로딩 오류:', error);
      Alert.alert('오류', '프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const selectImage = () => {
    const options = {
      maxWidth: 1000,
      maxHeight: 1000,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.assets && response.assets.length > 0) {
        const source = { uri: response.assets[0].uri };
        setProfileImage(source.uri);
        setImageFile(response.assets[0]);
      }
    });
  };

  const saveProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const formData = new FormData();
      
      formData.append('userId', userId);
      formData.append('name', newName);
      
      if (imageFile) {
        formData.append('profileImage', {
          name: imageFile.fileName || 'profile_image.jpg',
          type: imageFile.type || 'image/jpeg',
          uri: Platform.OS === 'android' ? imageFile.uri : imageFile.uri.replace('file://', '')
        });
      }

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPDATE_PROFILE}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      if (response.ok) {
        Alert.alert('성공', '프로필이 업데이트되었습니다.');
        setEditMode(false);
        fetchUserProfile();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      Alert.alert('오류', error.message);
    }
  };

  const changePassword = async () => {
    setPasswordError('');
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('모든 필드를 입력해주세요.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHANGE_PASSWORD}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          currentPassword,
          newPassword
        })
      });
      
      if (response.ok) {
        Alert.alert('성공', '비밀번호가 변경되었습니다.');
        setShowPasswordModal(false);
        // 필드 초기화
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const errorData = await response.json();
        setPasswordError(errorData.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      setPasswordError('서버 연결 오류');
    }
  };

  const deleteAccount = async () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem('userId');
              const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.DELETE_ACCOUNT}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: parseInt(userId) })
              });
              
              if (response.ok) {
                await AsyncStorage.clear();
                Alert.alert('성공', '계정이 삭제되었습니다.', [
                  { text: '확인', onPress: () => navigation.reset({
                    index: 0,
                    routes: [{ name: 'Auth' }],
                  })}
                ]);
              } else {
                const errorData = await response.json();
                throw new Error(errorData.message || '계정 삭제에 실패했습니다.');
              }
            } catch (error) {
              console.error('계정 삭제 오류:', error);
              Alert.alert('오류', error.message);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.card }]}>
              <Icon name="person" size={50} color={colors.gray} />
            </View>
          )}
          {editMode && (
            <TouchableOpacity style={styles.changeImageButton} onPress={selectImage}>
              <Icon name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        {editMode ? (
          <TextInput
            style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
            value={newName}
            onChangeText={setNewName}
            placeholder={t('enterName')}
            placeholderTextColor={colors.gray}
          />
        ) : (
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || t('noName')}</Text>
        )}
        
        <Text style={[styles.userEmail, { color: colors.gray }]}>{user?.email}</Text>
        
        {editMode ? (
          <View style={styles.editButtons}>
            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colors.card }]}
              onPress={() => {
                setEditMode(false);
                setNewName(user?.name || '');
                setProfileImage(user?.profileImage || null);
              }}
            >
              <Text style={{ color: colors.text }}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={saveProfile}
            >
              <Text style={{ color: '#fff' }}>{t('save')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => setEditMode(true)}
          >
            <Text style={{ color: '#fff' }}>{t('editProfile')}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('accountSettings')}</Text>
        
        <TouchableOpacity 
          style={styles.option}
          onPress={() => setShowPasswordModal(true)}
        >
          <Icon name="key-outline" size={24} color={colors.text} />
          <Text style={[styles.optionText, { color: colors.text }]}>{t('changePassword')}</Text>
          <Icon name="chevron-forward" size={24} color={colors.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.option}
          onPress={() => navigation.navigate('Language')}
        >
          <Icon name="language-outline" size={24} color={colors.text} />
          <Text style={[styles.optionText, { color: colors.text }]}>{t('language')}</Text>
          <Icon name="chevron-forward" size={24} color={colors.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.option}
          onPress={() => navigation.navigate('ThemeSettings')}
        >
          <Icon name="contrast-outline" size={24} color={colors.text} />
          <Text style={[styles.optionText, { color: colors.text }]}>{t('appearance')}</Text>
          <Icon name="chevron-forward" size={24} color={colors.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.option}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Icon name="notifications-outline" size={24} color={colors.text} />
          <Text style={[styles.optionText, { color: colors.text }]}>{t('notifications')}</Text>
          <Icon name="chevron-forward" size={24} color={colors.gray} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.deleteAccountButton, { borderColor: colors.danger }]}
        onPress={deleteAccount}
      >
        <Text style={{ color: colors.danger }}>{t('deleteAccount')}</Text>
      </TouchableOpacity>
      
      {/* 비밀번호 변경 모달 */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('changePassword')}</Text>
            
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
            
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder={t('currentPassword')}
              placeholderTextColor={colors.gray}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder={t('newPassword')}
              placeholderTextColor={colors.gray}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder={t('confirmNewPassword')}
              placeholderTextColor={colors.gray}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.card }]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
              >
                <Text style={{ color: colors.text }}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={changePassword}
              >
                <Text style={{ color: '#fff' }}>{t('change')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#82B5E1',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 16,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  nameInput: {
    fontSize: 20,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: '80%',
    textAlign: 'center',
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginTop: 10,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  section: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
  },
  deleteAccountButton: {
    marginTop: 20,
    marginBottom: 40,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default UserProfile;
