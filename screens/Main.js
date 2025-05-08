import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SERVER_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';


const Main = ({ navigation }) => {

  const [foodNameList, setFoodNameList] = useState([]);
  const [error, setError] = useState(null);
  const [ingredient, setIngredient] = useState('');
  const [ModalVisible, setModalVisible] = useState(false);  // modal state
  const [selectedRelationship, setSelectedRelationship] = useState("전체");

  useEffect(() => {
    const fetchFoodList = async () => {
      try {
        // 토큰 가져오기
        const accessToken = await AsyncStorage.getItem('accessToken');

        // 토큰이 없으면 API 호출하지 않도록 처리
        if (!accessToken) {
          console.log("토큰이 없습니다.");
          return;
        }

        const response = await fetch(`${SERVER_URL}/food/ownlist`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,  // Authorization 헤더에 토큰 추가
          },
        });
        console.log('accessToken: ', accessToken);
        const data = await response.json();
        console.log('소유 식재료:', data);

        // ✅ ownFoodList에서 필요한 필드만 추출
        const parsedItems = data.ownFoodList.map((item) => ({
          id: item.foodId,
          name: item.foodName,
          unit: item.unit,
          imageUrl: item.imgUrl,
          amount: item.amount,
        }));

        console.log('✅ parsedItems:', parsedItems);
        setFoodNameList(parsedItems);

        // if (data.ownFoodList) {
        //   setFoodNameList(data.ownFoodList.map(item => item.foodName));
        // } else {
        //   console.warn('ownFoodList가 응답에 없습니다.');
        // }
      } catch (error) {
        console.error('Food List 요청 실패:', error);
        setError("데이터를 가져오는 데 실패했습니다.");
      }
    };

    fetchFoodList();
  }, []);


  // const fetchFoodList = async () => {
  //   try {
  //     const response = await fetch(`${serverUrl}/food/ownlist`);
  //     const result = await response.json();


  //     setFoodNameList(result.ownFoodNameList);
  //     console.log(result.ownFoodNameList);


  //     if (result.success) {
  //       setFoodNameList(result.data);
  //     } else {
  //       throw new Error('Failed to fetch food list');
  //     }
  //   } catch (err) {
  //     setError("55" + err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchFoodList();
  // }, []);


  // const modifyFood = () => {
  //   if (ingredient.trim() !== '') {

  //   }
  // }



  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#2D336B", "#A9B5DF"]}
        style={styles.background}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 50, paddingTop: 9 }}>
        <View>
          <Text style={styles.title}>식재료 목록</Text>
        </View>
        <View style={styles.icon}>
          <TouchableOpacity
            style={styles.badge_button}
            onPress={() => { navigation.navigate('AddIngredient') }}>
            {/* onPress={() => setModalVisible(true)}> */}
            <Icon name='add' size={40} color='#fff' />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.badge_button}
            onPress={() => setModalVisible(true)}>
            <Icon name='edit' size={30} color='#fff' />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.box}>
        <View style={{ marginBottom: 15 }}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row' }}>
              {['전체', '채소', '과일', '육류', '해산물', '유제품', '기타'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.option,
                    selectedRelationship === item && styles.selectedButton
                  ]}
                  onPress={() => setSelectedRelationship(selectedRelationship === item ? null : item)}
                >
                  <Text style={[styles.buttonText, selectedRelationship === item && styles.selectedText]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.imageContainer}>
          <FlatList
            data={foodNameList}
            keyExtractor={(item, index) => item?.id?.toString?.() ?? index.toString()}
            key={3} // 🔥 numColumns과 맞춰주기!
            numColumns={3}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.photo} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text>이미지 없음</Text>
                  </View>
                )}
                <Text style={styles.name}>{item.name}</Text>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={styles.category}>{item.amount}</Text>
                  <Text style={styles.category}>
                    {item.unit === 'EA' ? '개' : item.unit}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>


      </View>

    </SafeAreaView >

  );
}

const styles = StyleSheet.create({
  gridItem: {
    width: '19%', // 3등분!
  },
  description: {
    padding: 5
  },
  category: {
    color: '#7886C7',
    marginLeft: 3,
    marginRight: -1,
    fontSize: 16
  },
  name: {
    fontWeight: '600',
    fontSize: 17,
    marginTop: 5,
    marginLeft: 3,
  },
  date: {
    marginVertical: 4,
    color: '#2D336B',
  },
  ingredient_view: {
    flexDirection: "row",  // 가로 정렬
    height: 200,  // 전체 높이 지정 (예제)
    gap: 15,
  },
  imageContainer: {
    flex: 1,   // 균등한 크기 분배
    aspectRatio: 1,  // 정사각형 유지
  },
  photo: {
    width: "90",
    height: "90",
    borderRadius: 10,
    borderColor: '#A9B5DF',
    borderWidth: 1,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  icon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    paddingRight: 20
  },
  badge_button: {
    marginLeft: 5,
  },
  selectedButton: {
    backgroundColor: '#1E2550',
  },
  selectedText: {
    color: 'white',
  },
  buttonText: {
    fontWeight: '600',
    marginVertical: 3,
  },
  box: {
    flex: 11,
    backgroundColor: '#ffffff',
    padding: 15,
    margin: 10,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    marginBottom: -15,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
    paddingLeft: 15,
  },
  ingredient: {
    marginBottom: 15,
    fontSize: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    fontSize: 20,
  },
  item: {
    padding: 10,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명 배경
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 15,
  },
  button: {
    flex: 1,
    padding: 9,
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  addButton: {
    backgroundColor: '#333f50',
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  buttonText1: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  buttonText2: {
    color: '#333f50',
    fontWeight: 'bold',
    fontSize: 18,
  },
  safeArea: {
    backgroundColor: "#186FF2",
    flex: 1,
  },
  option: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E2550',
    marginRight: 6,
    paddingHorizontal: 12,
  },
});

export default Main;