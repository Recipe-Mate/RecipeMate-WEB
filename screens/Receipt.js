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
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

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

  const reset = () => {
    setImageUri(null);
    setGroupedLines([]);
    setNormalizedLines([]);
    setFilteredItems([]);
    setJsonData([]);
    setDisplayedSize({ width: 0, height: 0 });
  };

  return (
    <View style={{ flex: 1 }}>
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
        <TouchableOpacity onPress={() => navigation.navigate('ReceiptTake')}>
          <View style={styles.sectionBox}>
            <Icon name='camera' size={50} color='#2D336B' />
            <View>
              <Text style={styles.ButtonText}>카메라로 촬영하기</Text>
              <Text style={styles.descText}>영수증을 촬영해보세요!</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ReceiptChoose')}>
          <View style={styles.sectionBox}>
            <Icon name='image' size={50} color='#2D336B' />
            <View>
              <Text style={styles.ButtonText}>이미지 업로드</Text>
              <Text style={styles.descText}>갤러리의 이미지를 등록해보세요!</Text>
            </View>
          </View>
        </TouchableOpacity>
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
  Icon: {
    fontSize: 55,
  }
});

export default Receipt;