import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Image, Modal } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const Receipt = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null); // 촬영한 사진 경로
  const [showPhoto, setShowPhoto] = useState(false); // 사진 전체보기 모달
  const cameraRef = useRef(null);
  const devices = useCameraDevices();
  const device = devices.back;

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  // 영수증 스캔(카메라 ON)
  const handleScanReceipt = () => {
    if (!hasPermission) {
      Alert.alert('카메라 권한 필요', '카메라 권한을 허용해 주세요.');
      return;
    }
    setIsScanning(true);
  };

  // 사진 촬영
  const handleTakePhoto = async () => {
    if (cameraRef.current == null) return;
    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      setCapturedPhoto(photo.path);
      setShowPhoto(true);
      setIsScanning(false);
    } catch (e) {
      Alert.alert('촬영 실패', '사진 촬영 중 오류가 발생했습니다.');
    }
  };

  // 사진 전체보기 닫기
  const handleClosePhoto = () => {
    setShowPhoto(false);
    setCapturedPhoto(null);
  };

  // 스캔 종료(카메라 닫기)
  const handleCloseCamera = () => {
    setIsScanning(false);
  };

  // 사진 업로드 함수(샘플)
  const handleUploadPhoto = () => {
    Alert.alert(
      '기능 준비 중',
      '사진 업로드 기능은 현재 개발 중입니다.',
      [{ text: '확인' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* 사진 전체보기 모달 */}
      <Modal visible={showPhoto} animationType="fade" transparent={false}>
        <View style={styles.photoModalContainer}>
          {capturedPhoto && (
            <Image source={{ uri: 'file://' + capturedPhoto }} style={styles.fullPhoto} resizeMode="contain" />
          )}
          <TouchableOpacity style={styles.closeButton} onPress={handleClosePhoto}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {/* 카메라 미리보기 */}
      <View style={styles.cameraContainer}>
        {isScanning && hasPermission && device ? (
          <>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              device={device}
              isActive={isScanning}
              photo={true}
            />
            <TouchableOpacity style={styles.shutterButton} onPress={handleTakePhoto}>
              <Text style={styles.shutterButtonText}>●</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseCamera}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.camera}>
            <Text style={styles.cameraText}>
              카메라 기능을 사용하려면{Platform.OS === 'android' ? '\n설정에서 권한을 허용하세요.' : ''}
            </Text>
          </View>
        )}
      </View>
      {/* 버튼 컨테이너 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isScanning && styles.buttonDisabled]}
          onPress={handleScanReceipt}
          disabled={isScanning}
        >
          <Text style={styles.buttonText}>{isScanning ? '카메라 ON' : '영수증 스캔'}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cameraText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  shutterButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#fff',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#3498db',
    zIndex: 10,
  },
  shutterButtonText: {
    color: '#3498db',
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: -4,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 10,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 20,
  },
  button: {
    backgroundColor: '#3498db',
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
  photoModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default Receipt;