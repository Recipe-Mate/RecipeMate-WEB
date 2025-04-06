import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';

// Receipt 컴포넌트: 영수증을 스캔하고 사진을 업로드하는 기능을 제공함
const Receipt = () => {
  const [isScanning, setIsScanning] = useState(false);

  // 영수증 스캔 함수
  const handleScanReceipt = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      Alert.alert(
        '기능 준비 중',
        '영수증 스캔 기능은 현재 개발 중입니다. 카메라 기능을 위해 react-native-vision-camera 패키지를 설치해 주세요.',
        [{ text: '확인' }]
      );
    }, 1000);
  };

  // 사진 업로드 함수
  const handleUploadPhoto = () => {
    Alert.alert(
      '기능 준비 중',
      '사진 업로드 기능은 현재 개발 중입니다.',
      [{ text: '확인' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* 카메라 화면 대신 임시 뷰 */}
      <View style={styles.cameraContainer}>
        <View style={styles.camera}>
          <Text style={styles.cameraText}>
            카메라 기능을 사용하려면{'\n'}react-native-vision-camera 패키지를 설치하세요
          </Text>
        </View>
      </View>

      {/* 버튼 컨테이너 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isScanning && styles.buttonDisabled]}
          onPress={handleScanReceipt}
          disabled={isScanning}
        >
          <Text style={styles.buttonText}>{isScanning ? '스캔 중...' : '영수증 스캔'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleUploadPhoto}>
          <Text style={styles.buttonText}>사진 업로드</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 스타일 정의함
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 2,
    backgroundColor: 'white',
  },
  camera: {
    width: '90%',
    height: '70%',
    backgroundColor: '#f0f0f0',
    alignSelf: 'center',
    marginTop: 80,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Receipt;