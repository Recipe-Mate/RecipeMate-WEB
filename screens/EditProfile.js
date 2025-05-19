import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../src/context/AuthContext';

const EditProfile = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [profileImage, setProfileImage] = useState(user?.profile || null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.7,
      includeBase64: false,
    }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('이미지 선택 오류', response.errorMessage || '알 수 없는 오류');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        setProfileImage(response.assets[0].uri);
      }
    });
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('닉네임을 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      await updateUser({ nickname, profile: profileImage });
      Alert.alert('프로필이 수정되었습니다.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('프로필 수정 실패', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.imageWrap} onPress={pickImage}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.defaultImage} />
        )}
        <Text style={styles.imageEditText}>사진 변경</Text>
      </TouchableOpacity>
      <Text style={styles.label}>닉네임</Text>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
        placeholder="닉네임을 입력하세요"
        maxLength={20}
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        <Text style={styles.saveButtonText}>{loading ? '저장 중...' : '저장'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  imageWrap: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
  },
  defaultImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
  },
  imageEditText: {
    marginTop: 8,
    color: '#2D336B',
    fontWeight: '600',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 16,
    color: '#222',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#2D336B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default EditProfile;
