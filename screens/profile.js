import React from 'react';
import { View, Text, StyleSheet, StatusBar, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView } from 'react-native-gesture-handler';

//import Badge from "./Badge";

// import profile_photo from "./assets/profile_icon";

const Profile = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#525C99", "#FFF2F2"]}
        locations={[0.1, 1]}
        style={styles.background}
      />
      <View style={styles.user_info}>
        <Image source={require('../assets/Profile_photo.png')} style={styles.photo}></Image>
        <Text style={styles.nickname}>ABC</Text>
        <Text style={styles.email}>abc1234@gmail.com</Text>
      </View>
      <View style={{ backgroundColor: '#EEF1FA', flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>


        <View style={{ padding: 20 }}>
          <TouchableOpacity
            style={{flexDirection:'row', alignItems: 'center'}}
            onPress={() => { navigation.navigate('CookedRecipes') }}>
            <Text style={styles.title}>요리한 레시피</Text>
            <Ionicons name='chevron-forward-outline' size={26} color='#2D336B' />
          </TouchableOpacity>
          <ScrollView horizontal={true}>
            <View style={{ alignItems: 'center' }}>
              <Image source={require('../assets/pancake.png')} style={styles.recipe_photo}></Image>
              <Text style={styles.recipe_photo_text}>팬케이크</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Image source={require('../assets/kimchi_stew.png')} style={styles.recipe_photo}></Image>
              <Text style={styles.recipe_photo_text}>김치찌개</Text>
            </View>
          </ScrollView>
          <View style={styles.divider}></View>
        </View>



        {/* <View style={styles.number_view}>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={styles.title}>가지고 있는 재료 수</Text>
            <Text style={styles.number}>5</Text>
          </View>
          <View style={styles.vertical_divider} />
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={styles.title}>만든 레시피 수</Text>
            <Text style={styles.number}>5</Text>
          </View>
        </View> */}


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
        <View style={{ flex: 4 }}>
          <Text style={styles.text1}>정보 수정하기(보류)</Text>
          <Text style={styles.text2}>계정 로그아웃</Text>
          <Text style={styles.text3}>탈퇴하기</Text>
        </View>
      </View>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  divider: {
    height: 1.2,
    backgroundColor: '#C3CBE9',
    marginVertical: 15,
},
  user_info: {
    alignItems: 'center',
  },
  nickname: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#F7F9FD'
  },
  email: {
    fontSize: 20,
    marginTop: 10,
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
    fontSize: 20,
    color: '#2D336B',
    fontWeight: '500',
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
    borderColor: '#000000',
    marginVertical: 15,
    marginRight: 20,
  },
  background: {
    ...StyleSheet.absoluteFillObject, // 배경을 전체 영역에 적용
  },
});

export default Profile;