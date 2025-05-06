import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Image, Modal, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import * as ImagePicker from 'react-native-image-picker';
import { processImage } from '../src/services/ocr';

const { width } = Dimensions.get('window');

const Receipt = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null); // 촬영한 사진 경로
  const [showPhoto, setShowPhoto] = useState(false); // 사진 전체보기 모달
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  
  // OCR 관련 상태 추가
  const [groupedLines, setGroupedLines] = useState([]);
  const [normalizedLines, setNormalizedLines] = useState([]);
  const [jsonData, setJsonData] = useState([]);
  const [ocrComplete, setOcrComplete] = useState(false); // OCR 처리 완료 여부
  
  const cameraRef = useRef(null);
  
  // 카메라 디바이스 관련 상태와 로직 단순화
  const devices = useCameraDevices();
  const device = devices.back;
  
  // 카메라 디바이스 감지 및 오류 처리 개선
  useEffect(() => {
    console.log('카메라 디바이스 상태:', 
      devices ? '로드됨' : '없음', 
      ', back:', device ? '있음' : '없음');
    
    // 추가 디버깅: 어떤 디바이스가 있는지 출력
    const checkDevices = async () => {
      try {
        const availableDevices = await Camera.getAvailableCameraDevices();
        console.log('사용 가능한 모든 카메라:', 
          availableDevices.length, '개', 
          availableDevices.map(d => d.position));
        
        // 카메라가 없는 경우 명확한 안내
        if (availableDevices.length === 0) {
          Alert.alert(
            '카메라를 찾을 수 없습니다',
            '기기에서 사용 가능한 카메라가 감지되지 않았습니다. 다음 확인 사항을 점검해보세요:\n\n1. 실제 기기를 사용 중인지 확인 (에뮬레이터는 카메라 지원이 제한적)\n2. 앱을 재시작해보세요\n3. 기기 설정에서 카메라 권한을 허용했는지 확인',
            [
              { 
                text: '갤러리에서 선택', 
                onPress: () => handleSelectFromGallery() 
              },
              { 
                text: '확인', 
                style: 'cancel' 
              }
            ]
          );
        }
      } catch (e) {
        console.error('카메라 디바이스 확인 오류:', e);
        Alert.alert(
          '카메라 오류',
          `카메라를 확인하는 중 오류가 발생했습니다: ${e.message || e}. 앱을 재시작하거나 기기를 점검해주세요.`
        );
      }
    };
    
    checkDevices();
    
  }, [devices, device]);

  // 카메라 권한 관리 개선
  useEffect(() => {
    (async () => {
      try {
        // 권한 요청
        const status = await Camera.requestCameraPermission();
        console.log('카메라 권한 요청 결과:', status);
        
        // 권한 상태 업데이트
        const isAuthorized = status === 'authorized' || status === 'granted';
        setHasPermission(isAuthorized);
        
        // 권한이 없으면 알림
        if (!isAuthorized) {
          Alert.alert(
            '카메라 권한 필요',
            '영수증 스캔을 위해 카메라 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
            [
              { text: '확인' },
              { 
                text: '설정으로 이동',
                onPress: () => {
                  // 아래는 React Native에서 설정 앱으로 이동하는 방법 (Linking 필요)
                  // Linking.openSettings();
                }
              }
            ]
          );
        }
      } catch (error) {
        console.error('카메라 권한 요청 오류:', error);
        Alert.alert(
          '권한 오류', 
          '카메라 권한을 확인하는 중 오류가 발생했습니다. 앱을 다시 시작하거나 설정에서 권한을 확인해주세요.'
        );
      }
    })();
  }, []);
  
  // 카메라 상태 변경 로그
  useEffect(() => {
    console.log('카메라 렌더링 조건 - isScanning && hasPermission && device:', 
      Boolean(isScanning), Boolean(hasPermission), Boolean(device), 
      Boolean(isScanning && hasPermission && device));
  }, [isScanning, hasPermission, device]);

  // 이미지 OCR 처리 함수 (ocr.js의 processImage 사용)
  const handleOcrProcess = async (uri) => {
    setIsLoading(true);
    try {
      const result = await processImage(uri);
      setGroupedLines(result.groupedLines);
      setNormalizedLines(result.normalizedLines);
      setJsonData(result.jsonData);
      setOcrComplete(true);
    } catch (e) {
      Alert.alert('이미지 처리 실패', '영수증 인식에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 영수증 스캔(카메라 ON)
  const handleScanReceipt = async () => {
    console.log('영수증 스캔 버튼 클릭');
    
    try {
      // 권한 확인 및 요청
      const status = await Camera.getCameraPermissionStatus();
      console.log('현재 카메라 권한 상태:', status);
      
      if (status !== 'authorized' && status !== 'granted') {
        console.log('권한이 없어 요청 시도');
        const newStatus = await Camera.requestCameraPermission();
        console.log('새 권한 상태:', newStatus);
        
        if (newStatus !== 'authorized' && newStatus !== 'granted') {
          Alert.alert(
            '카메라 권한 필요',
            '영수증 스캔을 위해 카메라 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
            [
              { text: '확인' },
              { 
                text: '설정으로 이동', 
                onPress: () => {
                  // 플랫폼별 설정 페이지로 이동
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
          return;
        }
      }
      
      // 권한 상태 업데이트
      setHasPermission(true);
      
      // 카메라 디바이스 확인
      if (!device) {
        console.log('사용 가능한 카메라가 없음');
        Alert.alert(
          '카메라를 찾을 수 없습니다', 
          '카메라를 인식할 수 없습니다. 앱을 재시작하거나 에뮬레이터 설정에서 카메라를 활성화해주세요.'
        );
        return;
      }
      
      // OCR 상태 초기화
      setGroupedLines([]);
      setNormalizedLines([]);
      setJsonData([]);
      setOcrComplete(false);
      
      // 카메라 활성화
      console.log('카메라 활성화:', device.id);
      setIsScanning(true);
    } catch (error) {
      console.error('카메라 활성화 오류:', error);
      Alert.alert('오류 발생', '카메라 실행 중 오류가 발생했습니다.');
    }
  };

  // 사진 촬영
  const handleTakePhoto = async () => {
    if (cameraRef.current == null) return;
    try {
      console.log('사진 촬영 시도');
      const photo = await cameraRef.current.takePhoto({ flash: 'off' });
      console.log('사진 촬영 성공:', photo.path);
      
      setCapturedPhoto(photo.path);
      setShowPhoto(true);
      setIsScanning(false);
      
      // 촬영한 사진에 OCR 처리 실행
      await handleOcrProcess(`file://${photo.path}`);
    } catch (e) {
      console.error('촬영 실패:', e);
      Alert.alert('촬영 실패', '사진 촬영 중 오류가 발생했습니다.');
    }
  };

  // 사진 전체보기 닫기
  const handleClosePhoto = () => {
    setShowPhoto(false);
    // capturedPhoto는 유지 (OCR 결과 표시를 위해)
  };

  // OCR 결과 초기화 및 처음으로 돌아가기
  const handleReset = () => {
    setOcrComplete(false);
    setCapturedPhoto(null);
    setGroupedLines([]);
    setNormalizedLines([]);
    setJsonData([]);
  };

  // 스캔 종료(카메라 닫기)
  const handleCloseCamera = () => {
    setIsScanning(false);
  };

  // 사진 업로드 함수(갤러리에서 선택)
  const handleUploadPhoto = async () => {
    try {
      // OCR 상태 초기화
      setGroupedLines([]);
      setNormalizedLines([]);
      setJsonData([]);
      setOcrComplete(false);
      
      console.log('이미지 선택 시작');
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
        includeBase64: false,
      });
      
      console.log('이미지 선택 결과:', result && result.assets ? '성공' : '취소됨');
      
      if (result.didCancel) {
        console.log('사용자가 이미지 선택을 취소했습니다');
        return;
      }
      
      if (result.errorCode) {
        console.error('이미지 선택 오류:', result.errorMessage);
        Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다: ' + result.errorMessage);
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        const selected = result.assets[0];
        console.log('선택된 이미지:', selected.uri);
        
        // 선택된 이미지 표시
        setCapturedPhoto(selected.uri.replace('file://', ''));
        setShowPhoto(true);
        
        // 선택된 이미지에 OCR 처리 실행
        await handleOcrProcess(selected.uri);
      }
    } catch (error) {
      console.error('이미지 업로드 처리 오류:', error);
      Alert.alert(
        '이미지 업로드 실패',
        '이미지를 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* 로딩 인디케이터 */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>영수증 인식 중...</Text>
        </View>
      )}
      
      {/* OCR 결과 화면 - 사진 촬영 후 처리 완료 시 표시 */}
      {capturedPhoto && ocrComplete ? (
        <ScrollView style={{ padding: 10 }}>
          <Text style={styles.headerText}>영수증 인식 결과</Text>
          
          {capturedPhoto && (
            <Image
              source={{ uri: capturedPhoto.includes('file://') ? capturedPhoto : `file://${capturedPhoto}` }}
              style={{ width: width - 20, height: 300, resizeMode: 'contain', marginVertical: 10 }}
            />
          )}

          <Text style={styles.sectionTitle}>📄 인식된 상품 목록</Text>
          {jsonData.length > 0 ? (
            jsonData.map((item, idx) => (
              <View key={idx} style={styles.itemContainer}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetail}>
                  {item.weight !== '0' ? `${item.weight}${item.unit} · ` : ''}
                  수량: {item.count}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noResultText}>인식된 상품이 없습니다.</Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleReset}>
              <Text style={styles.buttonText}>다시 스캔하기</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>식료품에 추가</Text>
            </TouchableOpacity>
          </View>

          {/* 개발용 디버그 정보 */}
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>⚙️ OCR 상세 정보 (개발용)</Text>
            
            <Text style={styles.debugSubtitle}>정규화된 텍스트:</Text>
            {normalizedLines.map((line, idx) => (
              <Text key={idx} style={styles.debugText}>• {line.text}</Text>
            ))}
            
            <Text style={styles.debugSubtitle}>Y좌표별 그룹화:</Text>
            {groupedLines.map((group, idx) => (
              <Text key={idx} style={styles.debugText}>
                {group.map((line) => line.text).join(' | ')}
              </Text>
            ))}
          </View>
        </ScrollView>
      ) : (
        <>
          {/* 사진 전체보기 모달 */}
          <Modal visible={showPhoto} animationType="fade" transparent={false}>
            <View style={styles.photoModalContainer}>
              {capturedPhoto && (
                <Image 
                  source={{ uri: capturedPhoto.includes('file://') ? capturedPhoto : `file://${capturedPhoto}` }} 
                  style={styles.fullPhoto} 
                  resizeMode="contain" 
                />
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
                  isActive={true}
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
                  {!device ? 
                    '카메라를 인식할 수 없습니다.\n앱을 다시 시작해보세요.' : 
                    `카메라 기능을 사용하려면${Platform.OS === 'android' ? '\n설정에서 권한을 허용하세요.' : ''}`}
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
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    color: '#3498db',
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
    paddingHorizontal: 30,
    borderRadius: 8,
    margin: 5,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  itemContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  noResultText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    marginVertical: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  debugSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555',
  },
  debugSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#555',
  },
  debugText: {
    fontSize: 12,
    color: '#777',
    marginBottom: 3,
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Receipt;