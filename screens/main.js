import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, StatusBar, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Main = ({ navigation }) => {

  const [foodNameList, setFoodNameList] = useState([]);
  const [error, setError] = useState(null);
  const [ingredient, setIngredient] = useState('');
  const [ModalVisible, setModalVisible] = useState(false);  // modal state

  // const userId = 7;

  // const fetchFoodList = async () => {
  //   try {
  //     const response = await fetch(`https://1828-182-221-151-160.ngrok-free.app/food/ownlist/${userId}`);
  //     const result = await response.json();


  //     setFoodNameList(result.ownFoodNameList);
  //     console.log(result.ownFoodNameList);


  //     // if (result.success) {
  //     //   setFoodNameList(result.data); // 서버에서 받은 리스트를 상태에 저장
  //     // } else {
  //     //   throw new Error('Failed to fetch food list');
  //     // }
  //   } catch (err) {
  //     setError("55" + err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchFoodList();
  // }, []);




  const addFood = () => {
    var foodToSend = {
      userId: 7,
      foodNameList: '양파'
    }
    fetch('https://b763-182-221-151-160.ngrok-free.app/food', {
      method: 'POST',
      body: JSON.stringify(foodToSend),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((responseJson) => {
        console.log(responseJson);
      })
  }

  const modifyFood = () => {
    if (ingredient.trim() !== '') {

    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
        <Text style={styles.title}>식재료 목록</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ justifyContent: 'flex-end' }}>
            
          </View>
          
        </View>
        <FlatList
          data={foodNameList} // 리스트 데이터
          keyExtractor={(item, index) => index.toString()} // 각 아이템에 key 설정
          renderItem={({ item }) => (
            <Text style={styles.item}>{item}</Text> // 리스트 아이템 출력
          )}
        />
      </View>
      <View>

      </View>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  box: {
    flex: 11,
    backgroundColor: '#ffffff',
    margin: 15,
    borderRadius: 25,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    alignItems: 'center',
    color: '#fff'
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
    backgroundColor: "#000",
    flex: 1,
  }
});

export default Main;