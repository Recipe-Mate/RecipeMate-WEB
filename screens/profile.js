import React from 'react';
import { View, Text, StyleSheet, StatusBar, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

//import Badge from "./Badge";

// import profile_photo from "./assets/profile_icon";

const Profile = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.user_info}>
        <Image source={require('../assets/Profile_photo.png')} style={styles.photo}></Image>
        <Text style={styles.nickname}>닉네임</Text>
        <Text style={styles.email}>이메일</Text>
      </View>


      <View style={{ backgroundColor: '#333f50', height: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={styles.horizontal_divider} />
      </View>
      <View style={styles.number_view}>
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Text style={styles.title}>가지고 있는 재료 수</Text>
          <Text style={styles.number}>5</Text>
        </View>
        <View style={styles.vertical_divider} />
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <Text style={styles.title}>만든 레시피 수</Text>
          <Text style={styles.number}>5</Text>
        </View>
      </View>
      <View style={{ backgroundColor: '#333f50', height: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={styles.horizontal_divider} />
      </View>
      <View style={styles.badge_title_view}>
        <Text style={styles.badge_title}>지금까지 획득한 배지</Text>
        <Icon name='label' size={20} color='#ffffff' ></Icon>
      </View>
      <View style={styles.badge_view}>
        <Image source={require('../assets/Badge1.png')} style={styles.badge_icon}></Image>
        <Image source={require('../assets/Badge2.png')} style={styles.badge_icon}></Image>
        <Image source={require('../assets/Badge3.png')} style={styles.badge_icon}></Image>
        <TouchableOpacity
          style={styles.badge_button}
          onPress={() => { navigation.navigate('Badge') }}>
          <Icon style={{ marginLeft: 20 }} name='add' size={50} color='#ffffff' />
        </TouchableOpacity>
      </View>
      <View style={{ flex: 4 }}>
        <Text style={styles.text1}>정보 수정하기(보류)</Text>
        <Text style={styles.text2}>계정 로그아웃</Text>
        <Text style={styles.text3}>탈퇴하기</Text>
      </View>
      <StatusBar barStyle="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#186FF2",
    flex: 1,
  },
  header: {
    height: 60,
    backgroundColor: '#333f50'
  },
  user_info: {
    alignItems: 'center',
  },
  nickname: {
    fontSize: 25,
    color: '#ffffff',
    fontWeight: 'bold',
    marginVertical: 10,
  },
  email: {
    fontSize: 20,
    color: 'gray',
    marginVertical: 10,
  },
  number_view: {
    flex: 1.5,
    backgroundColor: '#333f50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: -10,
  },
  number: {
    fontSize: 30,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 10,
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
    marginTop: 30,
    marginLeft: 25,
    fontSize: 20,
    fontWeight: 'bold',
  },
  text2: {
    marginTop: 20,
    marginLeft: 25,
    fontSize: 20,
    fontWeight: 'bold',
  },
  text3: {
    marginTop: 20,
    marginLeft: 25,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'tomato',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#000000',
    marginTop: 20,
    marginVertical: 10,
  }
});

export default Profile;