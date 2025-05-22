import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, TouchableOpacity, SafeAreaView, Alert, ScrollView, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import NicknameModal from './NicknameModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';

const Profile = ({ navigation }) => {
  const [nickname, setNickname] = useState('Sirius');
  const [newNickname, setNewNickname] = useState('');
  const [ModalVisible, setModalVisible] = useState(false);
  const [numOfItems, setNumOfItems] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recipes, setRecipes] = useState([]);


  const handleNicknameChange = () => {
    if (newNickname.trim() !== '') {
      setNickname(newNickname); // 닉네임 변경
      setModalVisible(false); // 모달 닫기
    } else {
      Alert.alert('닉네임을 입력하세요.');
    }
  };

  // 사용자 정보 가져오기
  const fetchUserInfo = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      console.log('userId: ', userId);

      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${SERVER_URL}/user?userId=${userId}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 응답 상태 코드:', response.status);
        console.error('서버 응답 메시지:', errorText);
        throw new Error('유저 정보 조회 실패');
      }

      const data = await response.json();
      setNickname(data.userName);
    } catch (error) {
      console.error('에러 발생:', error);
    }
  };

  const fetchNumOfItems = async () => {
    const value = await AsyncStorage.getItem('num_of_items');
    if (value !== null) {
      setNumOfItems(Number(value));
    }
  };

  const fetchUsedRecipes = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');

      const response = await fetch(`${SERVER_URL}/recipe/used`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`서버 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('서버에서 받은 데이터:', data);

      if (data.recipeList) {
        setRecipes(data.recipeList);
      }
    } catch (error) {
      console.error('레시피 사용 내역 가져오기 실패:', error);
    }
  };

  useEffect(() => {
    fetchNumOfItems();
    fetchUserInfo();
    fetchUsedRecipes();

  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchNumOfItems();
      fetchUserInfo();
    }, [])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchNumOfItems();
    await fetchUserInfo();
    setIsRefreshing(false);
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={["#525C99", "#FFF2F2"]}
          locations={[0.1, 1]}
          style={styles.background}
        />
        <View style={styles.user_info}>
          <Image source={require('../assets/Profile_photo.png')} style={styles.photo}></Image>
          <TouchableOpacity
            style={styles.badge_button}
            onPress={() => setModalVisible(true)}>
            <Text style={styles.nickname}>{nickname}</Text>
          </TouchableOpacity>
          <NicknameModal
            visible={ModalVisible}
            setVisible={setModalVisible}
            newNickname={newNickname}
            setNewNickname={setNewNickname}
            handleNicknameChange={handleNicknameChange}
            styles={styles}
          />
        </View>
        <View style={{ backgroundColor: '#EEF1FA', flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.number_title}>가지고 있는 재료 수</Text>
                <TouchableOpacity
                  style={styles.badge_button}
                  onPress={() => { navigation.navigate('MainStack'); }}>
                  <Text style={styles.number}>{numOfItems}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.number_title}>요리한 레시피 수</Text>
                <Text style={styles.number}>{recipes.length}</Text>
              </View>
            </View>
            <View style={styles.divider}></View>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => { navigation.navigate('RecipeCompletedList') }}>
              <Text style={styles.title}>요리한 레시피</Text>
              <Icon name='chevron-forward-outline' size={26} color='#2D336B' />
            </TouchableOpacity>
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {recipes.map((recipe) => (
                  <View key={recipe.id} style={styles.recipe}>
                    <Image source={{ uri: recipe.recipeImage }} style={styles.recipe_photo} />
                    <Text style={styles.recipe_photo_text}>{recipe.recipeName}</Text>
                  </View>
                ))}
                {/* <View style={styles.recipe}>
                  <Image source={require('../assets/pancake.png')} style={styles.recipe_photo}></Image>
                  <Text style={styles.recipe_photo_text}>팬케이크</Text>
                </View>
                <View style={styles.recipe}>
                  <Image source={require('../assets/kimchi_stew.png')} style={styles.recipe_photo}></Image>
                  <Text style={styles.recipe_photo_text}>김치찌개</Text>
                </View>
                <View style={styles.recipe}>
                  <Image source={require('../assets/chicken_porridge.png')} style={styles.recipe_photo}></Image>
                  <Text style={styles.recipe_photo_text}>닭죽</Text>
                </View> */}
              </View>
            </ScrollView>
            <View style={styles.divider}></View>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}>
              <Text style={styles.text1}>정보 수정하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  recipe: {
    alignItems: 'center',
    width: 120,
  },
  safeArea: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#7886C7',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    height: 45,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    gap: 15,
  },
  addButton: {
    flex: 1,
    padding: 9,
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: '#2D336B',
    height: 40,
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    padding: 9,
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: '#C3CBE9',
    height: 40,
    justifyContent: 'center',
  },
  buttonText1: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  buttonText2: {
    color: '#2D336B',
    fontWeight: 'bold',
    fontSize: 18,
  },
  divider: {
    height: 1.2,
    backgroundColor: '#C3CBE9',
    marginVertical: 10,
  },
  user_info: {
    alignItems: 'center',
  },
  nickname: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#F7F9FD',
    paddingBottom: 20,
  },
  email: {
    fontSize: 18,
    marginTop: 5,
    marginBottom: 20,
    color: '#C3CBE9'
  },
  number_view: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: '#2D336B',
    fontWeight: 'bold',
  },
  recipe_photo_text: {
    fontSize: 17,
    color: '#2D336B',
    fontWeight: '500',
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  number: {
    fontSize: 30,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  vertical_divider: {
    height: '100%',
    width: 3,
    backgroundColor: '#aaaaaa',
    marginLeft: 25,
    marginRight: 25,
  },
  horizontal_divider: {
    width: '90%',
    height: 4,
    backgroundColor: '#aaaaaa',
  },
  badge_title_view: {
    flex: 0.8,
    backgroundColor: '#333f50',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: -10,
  },
  badge_title: {
    marginLeft: 30,
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
    marginRight: 5,
  },
  badge_view: {
    flex: 1.2,
    backgroundColor: '#333f50',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
  },
  badge_icon: {
    width: 60,
    height: 60,
    marginLeft: 30,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000000',
  },
  text1: {
    marginBottom: 15,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D336B'
  },
  text2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'tomato',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#000000',
    marginTop: 30,
    marginBottom: 15,
  },
  recipe_photo: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: '#2D336B',
    marginVertical: 10,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  number_title: {
    fontSize: 16,
  },
});

export default Profile;