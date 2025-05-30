import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '@env';
import { Image as RNImage } from 'react-native';
import UnitPicker from "./UnitPicker";

const { width } = Dimensions.get('window');
const defaultImage = RNImage.resolveAssetSource(require('../assets/default.png'));

const excludedBrands = [
  '해태제과', '오리온', '크라운제과', '농심', '롯데제과', '삼양식품', '빙그레', '포카칩', '롯데푸드',
  '오뚜기', '팔도', 'CJ제일제당', '해찬들', '대상', '청정원', '샘표식품', '풀무원', '양반', '동원F&B',
  '사조대림', '백설', '샘표', '이금기', '해표', '비비고', '롯데칠성음료', '광동제약', '웅진식품',
  '동아오츠카', '해태htb', '코카콜라음료', '델몬트', '남양유업', '매일유업', '서울우유', '푸르밀',
  '종가집', '동원', '롯데', '해태', '동원', '국산'
].map((brand) => brand.toLowerCase());

const Receipt = ({ navigation }) => {
  const [imageUri, setImageUri] = useState(null);
  const [groupedLines, setGroupedLines] = useState([]);
  const [normalizedLines, setNormalizedLines] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [jsonData, setJsonData] = useState([]);
  const [displayedSize, setDisplayedSize] = useState({ width: 0, height: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [foodName, setFoodName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('');

  const openModalWithItem = (item) => {
    setSelectedItem(item);
    setFoodName(item.name);
    setAmount(String(item.weight * item.count));
    setUnit(item.unit);
    setModalVisible(true);
  };

  const sendIngredientsToServer = async (foodName, amount, unit) => {
    if (!foodName || !amount || !unit) return;

    try {
      const formData = new FormData();

      const foodList = [{
        foodName: foodName,
        amount: amount,
        unit: unit,
      }];

      formData.append('foodDataList', {
        string: JSON.stringify({ foodList }),
        name: 'foodDataList.json',
        type: 'application/json',
      });

      formData.append('images', {
        uri: Platform.OS === 'android' ? defaultImage.uri : defaultImage.uri.replace('file://', ''),
        type: 'image/jpeg',
        name: 'default.jpg',
      });

      const accessToken = await AsyncStorage.getItem('accessToken');

      const response = await fetch(`${SERVER_URL}/food`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      console.log('foodName: ', foodName);
      console.log('amount: ', amount);
      console.log('unit: ', unit);

      if (response.ok) {
        Alert.alert('성공', '서버에 성공적으로 전송되었습니다!', [{ text: '확인' }]);
        setModalVisible(false);
        setSelectedItem(null);
      } else {
        const errorText = await response.text();
        console.error('서버 응답 오류:', response.status, errorText);
        alert('서버 전송 실패');
      }
    } catch (error) {
      alert('네트워크 오류가 발생했습니다.');
      console.error('전송 중 에러 발생:', error);
    }
  };

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
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            takePhoto();
          } else {
            console.log('Camera permission denied');
          }
        } catch (err) {
          console.warn(err);
        }
      } else {
        takePhoto();
      }
    };

    requestCameraPermission();
  }, []);


  const preprocessName = (name) => {
    let raw = name.trim();

    // 숫자만 있거나 숫자 + 공백만 있는 경우
    if (/^[0-9]+\s*$/.test(raw)) {
      if (raw.trim().length === 1) {
        return raw.trim(); // 숫자 1개 또는 "4 " → "4"
      } else {
        return ''; // 숫자 2개 이상 → 제거
      }
    }

    // 일반 정제 과정
    let processed = raw;
    processed = processed.replace(/^[0-9]+\s*[a-zA-Z]/, '');
    processed = processed.replace(/^[0-9]+\s*/, '');
    processed = processed.replace(/[^가-힣0-9a-zA-Z\/\s]/g, ''); // '/'는 남김

    // '/' 기준으로 앞부분만 남기기 (용량 추출 위해 뒤쪽은 별도로 유지)
    const slashIndex = processed.indexOf('/');
    if (slashIndex !== -1) {
      processed = processed.substring(0, slashIndex);
    }

    processed = processed
      .replace(/([가-힣])([a-zA-Z0-9])/g, '$1 $2')
      .replace(/([a-zA-Z])([가-힣])/g, '$1 $2');
    processed = processed.replace(/\s+/g, ' ').trim().toLowerCase();

    excludedBrands.forEach((brand) => {
      processed = processed.replace(new RegExp(brand, 'gi'), '').trim();
    });

    return processed;
  };

  const processImage = async (uri) => {
    setImageUri(uri);
    Image.getSize(uri, (w, h) => setDisplayedSize({ width: w, height: h }));

    try {
      const result = await TextRecognition.recognize(uri, TextRecognitionScript.KOREAN);
      if (result?.blocks) {
        const lines = result.blocks.flatMap((block) =>
          block.lines.map((line) => ({
            text: line.text,
            y: line.bounding?.top ?? 0,
          }))
        ).filter((line) =>
          !/\d{10,}/.test(line.text) &&
          !/\d{1,3}[,.][^\s]{3}(?![^\s])/.test(line.text)
        );

        const grouped = [];
        lines.sort((a, b) => a.y - b.y);
        lines.forEach((line) => {
          const lastGroup = grouped[grouped.length - 1];
          if (!lastGroup || Math.abs(lastGroup[0].y - line.y) > 10) {
            grouped.push([line]);
          } else {
            lastGroup.push(line);
          }
        });

        const normalized = lines.filter((line) => /^\s*0{0,2}\d{1,2}P?\b/.test(line.text));
        setGroupedLines(grouped);
        setNormalizedLines(normalized);

        const items = normalized.map((line) => line.text);
        let processed = items.map((item) => preprocessName(item)).filter(Boolean);

        const withText = processed.filter(x => /[a-zA-Z가-힣]/.test(x));
        const onlyDigits = processed.filter(x => /^[0-9]$/.test(x));
        const reordered = [...withText, ...onlyDigits];

        setFilteredItems(reordered);

        const jsonResult = [];
        const len = Math.min(withText.length, onlyDigits.length);

        for (let i = 0; i < len; i++) {
          let name = withText[i];
          let weight = '0';
          let unit = '없음';

          const match = name.match(/(\d+(?:\.\d+)?)(kg|g|ml|l)/i);
          if (match) {
            weight = match[1];
            unit = match[2].toLowerCase();
            name = name.substring(0, match.index);
          } else {
            const numberIndex = name.search(/[0-9]/);
            if (numberIndex !== -1) {
              name = name.substring(0, numberIndex);
            }
          }
          jsonResult.push({
            name: name.trim(),
            weight: weight,
            unit: unit,
            count: onlyDigits[i],
          });
        }
        setJsonData(jsonResult);
      }
    } catch (e) {
      console.error('OCR 실패:', e);
    }
  };

  const takePhoto = () => {
    launchCamera({ mediaType: 'photo' }, (response) => {
      if (response.assets && response.assets.length > 0) {
        processImage(response.assets[0].uri);
      }
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={["#A9B5DF", "#EEF1FA"]}
          style={styles.background}
        />
        <ScrollView>
          <Image
            source={{ uri: imageUri }}
            style={styles.imgStyle}
          />
          {jsonData.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginVertical: 5 }}>
              <Text style={{ flex: 1 }}>
                🔸 {item.name} - {item.weight * item.count} - {item.unit}
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: '#2D336B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 10, }}
                onPress={() => openModalWithItem(item)}
              >
                <Text style={{ color: 'white' }}>등록</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20, }}>
            <View style={{ backgroundColor: 'white', borderRadius: 12, width: '100%', maxHeight: '100%', padding: 20, }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
                식재료 정보 수정
              </Text>
              <Text style={styles.modal_title}>식재료명</Text>
              <TextInput
                value={foodName}
                onChangeText={setFoodName}
                placeholder="예: 양파"
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10, }}
              />
              <Text style={styles.modal_title}>개수 / 용량</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="예: 100"
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10, }}
              />
              <Text style={styles.modal_title}>단위</Text>
              <UnitPicker onSelect={setUnit} selected={unit} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#888', padding: 12, borderRadius: 8, width: '45%', alignItems: 'center', marginTop: 15, }}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: 'white' }}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: '#2D336B', padding: 12, borderRadius: 8, width: '45%', alignItems: 'center', marginTop: 15, }}
                  onPress={() => sendIngredientsToServer(foodName, amount, unit)}
                >
                  <Text style={{ color: 'white' }}>등록하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
    paddingLeft: 15,
  },
  title2: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#2D336B',
  },
  modal_title: {
    marginBottom: 5,
  },
  imgStyle: {
    height: 300,
    resizeMode: 'contain',
    marginVertical: 20,
  },
  text: {
    fontSize: 18,
    marginVertical: 5,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
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
    paddingLeft: 20,
  },
  ButtonText: {
    fontSize: 25,
    fontWeight: '600',
    color: '#2D336B',
    paddingLeft: 15,
  },
  descText: {
    fontSize: 16,
    color: '#2D336B',
    paddingLeft: 15,
    paddingTop: 3,
  },
  Icon: {
    fontSize: 55,
  }
});

export default Receipt;