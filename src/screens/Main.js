import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SERVER_URL } from '@env';

const Main = ({ navigation }) => {

  const [foodNameList, setFoodNameList] = useState([]);
  const [error, setError] = useState(null);
  const [ingredient, setIngredient] = useState('');
  const [ModalVisible, setModalVisible] = useState(false);  // modal state
  const [selectedRelationship, setSelectedRelationship] = useState("전체");

  console.log(SERVER_URL);

  useEffect(() => {
    fetch(`${SERVER_URL}/food/ownlist`) // 여기에 API 주소 입력
      .then(response => response.json())
      .then(data => {
        console.log('API 응답:', data); // 여기를 먼저 확인
        const names = data.ownFoodList.map(item => item.foodName);
        setFoodNameList(names);
      })
      .catch(error => {
        console.error('Error fetching food list:', error);
      });
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
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 40 }}>
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
        
        <View>
          <FlatList
            data={foodNameList} // 리스트 데이터
            keyExtractor={(item, index) => index.toString()} // 각 아이템에 key 설정
            renderItem={({ item }) => (
              <Text style={styles.item}>{item}</Text> // 리스트 아이템 출력
            )}
          />
          <Text>Food List:</Text>
          {/* <FlatList
            data={foodNameList} // foodNameList는 상태에 저장된 데이터
            keyExtractor={(item) => item.foodId.toString()} // 각 항목의 고유 ID를 키로 사용
            renderItem={({ item }) => (
              <View>
                <Text>{item.foodName}</Text>
                <Text>{item.amount} {item.unit}</Text>
              </View>
            )}
          /> */}
        </View>
        <ScrollView>
          <View style={styles.ingredient_view}>
            <View style={styles.imageContainer}>
              <Image
                source={require("../../assets/cucumber.png")}
                style={styles.photo}
                resizeMode="cover"
              />
              <View style={styles.description}>
                <Text style={styles.category}>채소</Text>
                <Text style={styles.name}>오이</Text>
                <Text style={styles.date}>2025-04-03</Text>
              </View>
            </View>
            <View style={styles.imageContainer}>
              <Image
                source={require("../../assets/tomato.jpg")}
                style={styles.photo}
                resizeMode="cover"
              />
              <View style={styles.description}>
                <Text style={styles.category}>채소</Text>
                <Text style={styles.name}>토마토</Text>
                <Text style={styles.date}>2025-04-03</Text>
              </View>
            </View>
            <View style={styles.imageContainer}>
              <Image
                source={require("../../assets/banana.jpg")}
                style={styles.photo}
                resizeMode="cover"
              />
              <View style={styles.description}>
                <Text style={styles.category}>과일</Text>
                <Text style={styles.name}>바나나</Text>
                <Text style={styles.date}>2025-04-03</Text>
              </View>
            </View>
          </View>

        </ScrollView>

      </View>


      {/* <FlatList
          data={foodNameList} // 리스트 데이터
          keyExtractor={(item, index) => index.toString()} // 각 아이템에 key 설정
          renderItem={({ item }) => (
            <Text style={styles.item}>{item}</Text> // 리스트 아이템 출력
          )}
        /> */}

    </SafeAreaView >

  );
}

const styles = StyleSheet.create({
  description: {
    padding: 5
  },
  category: {
    marginVertical: 4,
    color: '#7886C7',
  },
  name: {
    fontWeight: '600',
    fontSize: 20,
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
    width: "100%",
    height: "100%",
    borderRadius: 10,
    borderColor: '#A9B5DF',
    borderWidth: 1,
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
    fontSize: 28,
    fontWeight: 'bold',
    alignItems: 'center',
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
    padding: 5,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E2550',
    marginHorizontal: 4,
    paddingHorizontal: 12,
  },
});

export default Main;