import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import { parseReceiptImage } from '../src/utils/receiptParser';
import excludedBrands from '../src/utils/excludedBrands';
import ingredientWhitelist from '../src/utils/ingredientWhitelist';
import apiConfig from '../config/api.config';
import apiService from '../src/services/api.service';
import { useAuth } from '../src/context/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'react-native-linear-gradient';


const { width } = Dimensions.get('window');

function filterAndNormalizeIngredients(scanResults) {
  return scanResults
    .filter(item => ingredientWhitelist.some(ing => item.name.includes(ing)))
    .map(item => {
      let displayUnit = item.unit !== '없음' ? item.unit : '개';
      let displayWeight = item.weight !== '0' ? item.weight : '';
      let displayCount = item.count || '1';
      return {
        name: item.name,
        amount: displayWeight,
        unit: displayUnit,
        count: displayCount
      };
    });
}

const Receipt = () => {
  const [imageUri, setImageUri] = useState(null);
  const [groupedLines, setGroupedLines] = useState([]);
  const [normalizedLines, setNormalizedLines] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [jsonData, setJsonData] = useState([]);
  const [displayedSize, setDisplayedSize] = useState({ width: 0, height: 0 });
  const [userIngredients, setUserIngredients] = useState([]);
  const [editableIngredients, setEditableIngredients] = useState([]);
  const [inputErrorIdx, setInputErrorIdx] = useState(null); // 에러 인덱스
  const [inputErrorField, setInputErrorField] = useState(null); // 에러 필드명
  const { user } = useAuth();

  useEffect(() => {
    const requestCameraPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Camera Permission',
              message: 'This app requires camera access to scan receipts.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Camera permission denied');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };
    requestCameraPermission();
  }, []);

  // OCR 결과가 바뀔 때마다 편집용 배열로 복사(식재료 사전에 포함된 것만)
  useEffect(() => {
    if (jsonData.length > 0) {
      setEditableIngredients(
        jsonData
          .filter(item => ingredientWhitelist.some(ing => item.name.includes(ing)))
          .map(item => ({ ...item }))
      );
    } else {
      setEditableIngredients([]);
    }
  }, [jsonData]);

  const processImage = async (uri) => {
    setImageUri(uri);
    Image.getSize(uri, (w, h) => setDisplayedSize({ width: w, height: h }));
    try {
      const jsonResult = await parseReceiptImage(uri);
      setJsonData(jsonResult);
    } catch (e) {
      console.error('OCR 실패:', e);
    }
  };

  const chooseImage = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets.length > 0) {
        processImage(response.assets[0].uri);
      }
    });
  };

  const takePhoto = () => {
    ImagePicker.launchCamera({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets.length > 0) {
        processImage(response.assets[0].uri);
      }
    });
  };

  const reset = () => {
    setImageUri(null);
    setGroupedLines([]);
    setNormalizedLines([]);
    setFilteredItems([]);
    setJsonData([]);
    setDisplayedSize({ width: 0, height: 0 });
  };

  const handleEditIngredient = (idx, field, value) => {
    setEditableIngredients(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  // userId 추출 함수 (AddFood.js 참고)
  const getUserId = () => {
    if (!user) return null;
    if (user.id) return user.id;
    if (user.user_id) return user.user_id;
    if (user.user && user.user.user_id) return user.user.user_id;
    return null;
  };

  // 사용자 식재료 리스트에 추가 (중복은 수량 합침, 총양/단위 반영)
  const handleAddIngredients = async () => {
    // 입력값 검증: 하나라도 비어있거나, 0, 음수, 숫자 아님, 공백만 입력 등 에러 처리
    for (let i = 0; i < editableIngredients.length; i++) {
      const item = editableIngredients[i];
      if (!item.name || item.name.trim() === "") {
        Alert.alert('입력 오류', '식재료명을 입력해주세요.');
        return;
      }
      if (!item.weight || item.weight.trim() === "" || isNaN(item.weight) || parseFloat(item.weight) <= 0) {
        Alert.alert('입력 오류', '양(숫자, 0보다 커야 함)을 입력해주세요.');
        return;
      }
      if (!item.unit || item.unit.trim() === "") {
        Alert.alert('입력 오류', '단위를 입력해주세요.');
        return;
      }
      if (!item.count || item.count.trim() === "" || isNaN(item.count) || parseFloat(item.count) <= 0) {
        Alert.alert('입력 오류', '개수(숫자, 0보다 커야 함)를 입력해주세요.');
        return;
      }
    }
    // userId/토큰 세팅
    if (user && user.access_token) {
      apiService.setToken(user.access_token);
    }
    const userId = getUserId();
    if (!userId) {
      Alert.alert('로그인 필요', '식재료 추가는 로그인 후 이용 가능합니다.');
      return;
    }
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
      Alert.alert('유저 정보 오류', '유저 ID가 올바르지 않습니다. 다시 로그인해 주세요.');
      return;
    }
    // AddFood.js와 동일한 DTO 구조로 변환
    const foodData = {
      foodNameList: editableIngredients.map(item => item.name.trim()),
      quantityList: editableIngredients.map(item => item.weight.trim()),
      unitList: editableIngredients.map(item => item.unit.trim())
    };
    try {
      const response = await apiService.addFood(numericUserId, foodData);
      if (response.success) {
        Alert.alert('추가 성공', '식재료가 성공적으로 추가되었습니다.');
        reset(); // 추가 성공 시 초기화하여 이미지 선택/촬영 화면으로 이동
      } else {
        throw new Error(response.error || '식재료 추가에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류 발생', error.message || '식재료 추가 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {!imageUri ? (
        <View style={{ flex: 1 }}>
          <LinearGradient
            colors={["#2D336B", "#A9B5DF"]}
            style={styles.background}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 50, paddingTop: 9 }}>
            <Text style={styles.title}>영수증 스캔</Text>
          </View>
          <View style={styles.textBox}>
            <Text style={styles.text}>식재료 등록이 귀찮을 때</Text>
            <Text style={styles.text}>영수증을 카메라로 촬영하거나</Text>
            <Text style={styles.text}>이미지를 업로드하여 </Text>
            <Text style={styles.text}>식재료 등록을 간편하게 해보세요!</Text>
          </View>
          <TouchableOpacity onPress={takePhoto}>
            <View style={styles.sectionBox}>
              <Icon name='camera' size={50} color='#2D336B' />
              <View>
                <Text style={styles.ButtonText}>카메라로 촬영하기</Text>
                <Text style={styles.descText}>영수증을 촬영해보세요!</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={chooseImage}>
            <View style={styles.sectionBox}>
              <Icon name='image' size={50} color='#2D336B' />
              <View>
                <Text style={styles.ButtonText}>이미지 업로드</Text>
                <Text style={styles.descText}>갤러리의 이미지를 등록해보세요!</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ padding: 10, backgroundColor: '#E8EBFC' }}
          contentContainerStyle={{ paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        >

          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={reset}>
              <Text style={styles.sectionTitle}>⬅ 영수증 스캔 결과</Text>

            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: imageUri }}
            style={{ width: width, height: 300, resizeMode: 'contain', borderRadius: 18, marginBottom: 16 }}
          />


          {/* Toss 스타일 컬럼 헤더 */}
          <View style={styles.tossHeaderRow}>
            <Text style={[styles.tossHeaderCell, { flex: 2 }]}>식재료명</Text>
            <Text style={[styles.tossHeaderCell, { flex: 1, textAlign: 'right' }]}>양</Text>
            <Text style={[styles.tossHeaderCell, { flex: 1, textAlign: 'center' }]}>단위</Text>
            <Text style={[styles.tossHeaderCell, { flex: 1, textAlign: 'right' }]}>개수</Text>
            <Text style={[styles.tossHeaderCell, { flex: 1.5, textAlign: 'right' }]}>(총)양</Text>
            <Text style={[styles.tossHeaderCell, { flex: 1, textAlign: 'center' }]}>단위</Text>
          </View>
          {editableIngredients.map((item, idx) => {
            const amountNum = parseFloat(item.weight) || 0;
            const countNum = parseFloat(item.count) || 1;
            const totalAmount = amountNum * countNum;
            const displayUnit = (item.unit && item.unit !== '없음') ? item.unit : '';
            return (
              <View key={idx} style={styles.tossCardRow}>
                <TextInput
                  style={[styles.tossInput, styles.tossInputName, inputErrorIdx === idx && inputErrorField === 'name' && styles.inputError]}
                  value={item.name}
                  onChangeText={text => handleEditIngredient(idx, 'name', text)}
                  placeholder="식재료명"
                  placeholderTextColor="#bbb"
                />
                <TextInput
                  style={[styles.tossInput, styles.tossInputAmount, inputErrorIdx === idx && inputErrorField === 'weight' && styles.inputError]}
                  value={item.weight}
                  onChangeText={text => handleEditIngredient(idx, 'weight', text)}
                  placeholder="양"
                  keyboardType="numeric"
                  placeholderTextColor="#bbb"
                />
                <TextInput
                  style={[styles.tossInput, styles.tossInputUnit, inputErrorIdx === idx && inputErrorField === 'unit' && styles.inputError]}
                  value={item.unit === '없음' ? '' : item.unit}
                  onChangeText={text => handleEditIngredient(idx, 'unit', text)}
                  placeholder="단위"
                  placeholderTextColor="#bbb"
                />
                <TextInput
                  style={[styles.tossInput, styles.tossInputCount, inputErrorIdx === idx && inputErrorField === 'count' && styles.inputError]}
                  value={item.count}
                  onChangeText={text => handleEditIngredient(idx, 'count', text)}
                  placeholder="개수"
                  keyboardType="numeric"
                  placeholderTextColor="#bbb"
                />
                <View style={[styles.tossInput, styles.tossInputTotal, { backgroundColor: '#F6F8FA', borderWidth: 0, alignItems: 'flex-end', justifyContent: 'center' }]}>
                  <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 15 }}>{totalAmount > 0 ? totalAmount : ''}</Text>
                </View>
                <View style={[styles.tossInput, styles.tossInputTotalUnit, { backgroundColor: '#F6F8FA', borderWidth: 0, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 15 }}>{displayUnit}</Text>
                </View>
              </View>
            );
          })}



          {jsonData.length > 0 && (
            <TouchableOpacity onPress={handleAddIngredients} style={styles.tossAddButton}>
              <Text style={styles.tossAddButtonText}>식재료 추가</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
    paddingLeft: 15,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  text: {
    fontSize: 18,
    marginVertical: 5,
  },
  textBox: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    margin: 10,
    borderRadius: 20,
    marginBottom: 3,
    alignItems: 'center',
    paddingVertical: 100,
  },
  sectionBox: {
    backgroundColor: '#EEF1FA',
    padding: 15,
    margin: 10,
    borderRadius: 20,
    marginBottom: 3,
    alignItems: 'center',
    height: 120,
    justifyContent: 'flex-start',
    flexDirection: 'row',
    paddingLeft: 25,
  },
  ButtonText: {
    fontSize: 23,
    fontWeight: '600',
    color: '#2D336B',
    paddingLeft: 20,
  },
  descText: {
    fontSize: 16,
    color: '#2D336B',
    paddingLeft: 20,
    paddingTop: 3,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 16,
    color: '#222',
    letterSpacing: -0.5,
    paddingLeft: 10,
  },
  tossHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 6,
    marginHorizontal: 2,
  },
  tossHeaderCell: {
    fontSize: 15,
    color: '#888',
    fontWeight: '600',
    paddingHorizontal: 2,
  },
  tossCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    marginHorizontal: 2,
    paddingVertical: 10,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F1F4',
  },
  tossInput: {
    borderWidth: 1,
    borderColor: '#E5E8EB',
    borderRadius: 10,
    backgroundColor: '#F6F8FA',
    fontSize: 15,
    color: '#222',
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginHorizontal: 1,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
  tossInputName: { flex: 2, minWidth: 60, maxWidth: 120 },
  tossInputAmount: { flex: 1, minWidth: 40, maxWidth: 60, textAlign: 'right' },
  tossInputUnit: { flex: 1, minWidth: 40, maxWidth: 60, textAlign: 'center' },
  tossInputCount: { flex: 1, minWidth: 30, maxWidth: 50, textAlign: 'right' },
  tossInputTotal: { flex: 1.5, minWidth: 50, maxWidth: 80 },
  tossInputTotalUnit: { flex: 1, minWidth: 30, maxWidth: 50 },
  inputError: {
    borderColor: 'red',
    backgroundColor: '#FFF0F0',
  },
  tossBackButton: {
    marginTop: 18,
    alignSelf: 'flex-start',
    marginLeft: 2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E5E8EB',
  },
  tossBackButtonText: {
    color: '#2D336B',
    fontSize: 16,
    fontWeight: '500',
  },
  tossAddButton: {
    backgroundColor: '#2D336B',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tossAddButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'System',
  },
});

export default Receipt;