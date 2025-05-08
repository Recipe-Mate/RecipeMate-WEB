import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { ScrollView } from 'react-native-gesture-handler';
import NicknameModal from './NicknameModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '@env';

//import Badge from "./Badge";

// import profile_photo from "./assets/profile_icon";

const Profile = ({ navigation }) => {
  const [nickname, setNickname] = useState('Sirius');
  const [newNickname, setNewNickname] = useState('');
  const [ModalVisible, setModalVisible] = useState(false);  // modal state
  const [numOfItems, setNumOfItems] = useState(0);

  const handleNicknameChange = () => {
    if (newNickname.trim() !== '') {
      setNickname(newNickname); // 닉네임 변경
      setModalVisible(false); // 모달 닫기
    } else {
      Alert.alert('닉네임을 입력하세요.');
    }
  };



  const fetchUserInfo = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      console.log('userId: ', userId);
      console.log(`${SERVER_URL}/user?userId=${userId}`);

      const accessToken = await AsyncStorage.getItem('accessToken');

      const response = await fetch(`${SERVER_URL}/user?userId=${userId}`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();  // 서버 에러 내용 직접 보기
        console.error('서버 응답 상태 코드:', response.status);
        console.error('서버 응답 메시지:', errorText);
        throw new Error('유저 정보 조회 실패');
      }

      const data = await response.json();
      console.log('유저 정보:', data);
      setNickname(data.userName);  // userName 값을 nickname으로 저장
    } catch (error) {
      console.error('에러 발생:', error);
    }
  };

  useEffect(() => {
    const fetchNumOfItems = async () => {
      const value = await AsyncStorage.getItem('num_of_items');
      if (value !== null) {
        setNumOfItems(Number(value));
      }
    };

    fetchNumOfItems();
    fetchUserInfo();
  }, []);



  return (
    <ScrollView>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
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
          {/* <Text style={styles.email}>abc1234@gmail.com</Text> */}
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
                <Text style={styles.number}>3</Text>
              </View>
            </View>
            <View style={styles.divider}></View>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center' }}
              onPress={() => { navigation.navigate('CookedRecipes') }}>
              <Text style={styles.title}>요리한 레시피</Text>
              <Icon name='chevron-forward-outline' size={26} color='#2D336B' />
            </TouchableOpacity>
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={styles.recipe}>
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
                </View>
              </View>
            </ScrollView>
            <View style={styles.divider}></View>
            <TouchableOpacity
              style={styles.badge_button}
              onPress={() => setModalVisible(true)}>
              <Text style={styles.text1}>정보 수정하기</Text>
            </TouchableOpacity>
            <NicknameModal
              visible={ModalVisible}
              setVisible={setModalVisible}
              newNickname={newNickname}
              setNewNickname={setNewNickname}
              handleNicknameChange={handleNicknameChange}
              styles={styles}
            />
            <Text style={styles.text1}>계정 로그아웃</Text>
            <Text style={styles.text2}>탈퇴하기</Text>
          </View>





          {/* <View style={styles.badge_view}>
          <Image source={require('../assets/Badge1.png')} style={styles.badge_icon}></Image>
          <Image source={require('../assets/Badge2.png')} style={styles.badge_icon}></Image>
          <Image source={require('../assets/Badge3.png')} style={styles.badge_icon}></Image>
          <TouchableOpacity
            style={styles.badge_button}
            onPress={() => { navigation.navigate('Badge') }}>
            <Ionicons style={{ marginLeft: 20 }} name='add' size={50} color='#ffffff' />
          </TouchableOpacity>
        </View> */}

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
    fontSize: 18,
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
    marginVertical: 15,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  number_title: {
    fontSize: 16,
  },
});

export default Profile;