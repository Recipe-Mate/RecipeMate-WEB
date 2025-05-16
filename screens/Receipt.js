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
        <View style={styles.centered}>
          <Button title="📷 카메라로 촬영하기" onPress={takePhoto} />
          <View style={{ marginVertical: 10 }} />
          <Button title="🖼 이미지 선택하기" onPress={chooseImage} />
        </View>
      ) : (
        <ScrollView 
          style={{ padding: 10 }}
          contentContainerStyle={{ paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={{ uri: imageUri }}
            style={{ width: width, height: 300, resizeMode: 'contain' }}
          />

          <Text style={styles.sectionTitle}>📄 영수증 스캔 결과</Text>

          {/* 편집 가능한 식재료 리스트 (식재료명 | 양 | 단위 | 개수 | (총)양 | 단위) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ width: 80, fontWeight: 'bold' }}>식재료명</Text>
            <Text style={{ width: 50, fontWeight: 'bold', textAlign: 'right' }}>양</Text>
            <Text style={{ width: 50, fontWeight: 'bold', textAlign: 'center' }}>단위</Text>
            <Text style={{ width: 40, fontWeight: 'bold', textAlign: 'right' }}>개수</Text>
            <Text style={{ width: 70, fontWeight: 'bold', textAlign: 'right' }}>(총)양</Text>
            <Text style={{ width: 40, fontWeight: 'bold', textAlign: 'center' }}>단위</Text>
          </View>
          {editableIngredients.map((item, idx) => {
            // 총양 계산: (양 * 개수), 단위는 그대로
            const amountNum = parseFloat(item.weight) || 0;
            const countNum = parseFloat(item.count) || 1;
            const totalAmount = amountNum * countNum;
            const displayUnit = (item.unit && item.unit !== '없음') ? item.unit : '';
            return (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <TextInput
                  style={{ borderWidth: 1, borderColor: inputErrorIdx === idx && inputErrorField === 'name' ? 'red' : '#ccc', borderRadius: 4, padding: 4, width: 80, marginRight: 4 }}
                  value={item.name}
                  onChangeText={text => handleEditIngredient(idx, 'name', text)}
                  placeholder="식재료명"
                />
                <TextInput
                  style={{ borderWidth: 1, borderColor: inputErrorIdx === idx && inputErrorField === 'weight' ? 'red' : '#ccc', borderRadius: 4, padding: 4, width: 50, marginRight: 4, textAlign: 'right' }}
                  value={item.weight}
                  onChangeText={text => handleEditIngredient(idx, 'weight', text)}
                  placeholder="양"
                  keyboardType="numeric"
                />
                <TextInput
                  style={{ borderWidth: 1, borderColor: inputErrorIdx === idx && inputErrorField === 'unit' ? 'red' : '#ccc', borderRadius: 4, padding: 4, width: 50, marginRight: 4, textAlign: 'center' }}
                  value={item.unit === '없음' ? '' : item.unit}
                  onChangeText={text => handleEditIngredient(idx, 'unit', text)}
                  placeholder="단위"
                />
                <TextInput
                  style={{ borderWidth: 1, borderColor: inputErrorIdx === idx && inputErrorField === 'count' ? 'red' : '#ccc', borderRadius: 4, padding: 4, width: 40, marginRight: 4, textAlign: 'right' }}
                  value={item.count}
                  onChangeText={text => handleEditIngredient(idx, 'count', text)}
                  placeholder="개수"
                  keyboardType="numeric"
                />
                <View style={{ width: 70, alignItems: 'flex-end', marginRight: 4 }}>
                  <Text style={{ color: '#333', fontWeight: 'bold' }}>{totalAmount > 0 ? totalAmount : ''}</Text>
                </View>
                <View style={{ width: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#333', fontWeight: 'bold' }}>{displayUnit}</Text>
                </View>
              </View>
            );
          })}

          <TouchableOpacity onPress={reset} style={{ marginTop: 20 }}>
            <Text style={{ color: 'blue', fontSize: 16 }}>⬅ 뒤로가기</Text>
          </TouchableOpacity>

          {jsonData.length > 0 && (
            <TouchableOpacity onPress={handleAddIngredients} style={{ marginTop: 20, backgroundColor: '#4caf50', padding: 12, borderRadius: 8 }}>
              <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>식재료 추가</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
});

export default Receipt;