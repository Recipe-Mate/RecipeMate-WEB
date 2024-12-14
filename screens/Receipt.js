import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, PermissionsAndroid } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const Receipt = () => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const cameraRef = useRef(null);

  const devices = useCameraDevices();

  useEffect(() => {
    if (devices) {
      const backCamera = Object.values(devices).find((device) => device.position === 'back');
      if (backCamera) {
        setSelectedDevice(backCamera);
        console.log("선택된 후면 카메라 장치:", backCamera);
      } else {
        console.log("후면 카메라를 찾을 수 없습니다.");
      }
    }
  }, [devices]);

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'We need access to your camera for scanning receipts',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Camera permission granted');
      } else {
        console.log('Camera permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const handleScanReceipt = async () => {
    if (cameraRef.current) {
      try {
        setIsScanning(true);
        console.log('영수증 스캔 시작');

        // 사진 촬영
        const photo = await cameraRef.current.takePhoto({
          qualityPrioritization: 'balanced',
        });
        console.log('사진 촬영 완료:', photo.path);

        Alert.alert('사진 촬영 완료', `사진이 저장되었습니다: ${photo.path}`);
      } catch (error) {
        console.error('사진 촬영 중 오류:', error);
        Alert.alert('오류', '사진 촬영 중 문제가 발생했습니다.');
      } finally {
        setIsScanning(false);
      }
    } else {
      Alert.alert('오류', '카메라가 준비되지 않았습니다.');
    }
  };

  const handleUploadPhoto = () => {
    console.log('사진 업로드 기능 미구현');
  };

  return (
    <View style={styles.container}>
      {/* 카메라 화면 */}
      <View style={styles.cameraContainer}>
        {selectedDevice ? (
          <Camera
            ref={cameraRef}
            style={styles.camera}
            device={selectedDevice}
            isActive={true}
            photo={true}
          />
        ) : (
          <Text style={styles.cameraText}>카메라 로딩 중...</Text>
        )}
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
    width: '90%', // 카메라 화면 크기 조정
    height: '70%',
    backgroundColor: 'gray',
    alignSelf: 'center',
    marginTop: 80,
    borderRadius: 15,
  },
  cameraText: {
    color: 'black',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 30,
  },
  button: {
    backgroundColor: '#3498db', // 파란색 버튼
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25, // 둥근 테두리
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#a6cce2', // 비활성화된 버튼 색상
  },
});

export default Receipt;