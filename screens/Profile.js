import React from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../src/context/AuthContext';
import { clearToken } from '../src/services/api.service';

// Profile 컴포넌트: 사용자 프로필 화면을 렌더링함
const Profile = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (!result.success) {
        Alert.alert('로그아웃 실패', result.error || '로그아웃에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류 발생', '로그아웃 중 오류가 발생했습니다.');
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}></View>

      <View style={styles.user_info}>
        <View style={{ justifyContent: 'center' }}>
          {/* 이미지 대신 아이콘 사용 */}
          <View style={styles.photo}>
            <Icon name="person" size={40} color="#ffffff" />
          </View>
        </View>
        <View style={{ flexDirection: 'column', justifyContent: 'center', marginLeft: 15 }}>
          <Text style={styles.nickname}>{user?.name || '닉네임'}</Text>
          <Text style={styles.email}>{user?.email || '이메일'}</Text>
        </View>
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
        <Icon name='label' size={20} color='#ffffff'></Icon>
      </View>

      <View style={styles.badge_view}>
        {/* 이미지 대신 아이콘 사용 */}
        <View style={styles.badge_icon}>
          <Icon name="star" size={30} color="#FFD700" />
        </View>
        <View style={styles.badge_icon}>
          <Icon name="local-dining" size={30} color="#FFD700" />
        </View>
        <View style={styles.badge_icon}>
          <Icon name="emoji-events" size={30} color="#FFD700" />
        </View>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>계정 관리</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>프로필 수정</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>비밀번호 변경</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 설정</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>알림 설정</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>언어 설정</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>레시피 관리</Text>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('FavoriteRecipes')} // FavoriteRecipesScreen으로 이동
        >
          <Text style={styles.menuText}>즐겨찾는 레시피</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      <StatusBar barStyle="light" />
    </ScrollView>
  );
};

// 스타일 정의함
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    height: 60,
    backgroundColor: '#333f50',
  },
  user_info: {
    flex: 1.5,
    backgroundColor: '#333f50',
    flexDirection: 'row',
    marginTop: -10,
    paddingBottom: 20,
  },
  nickname: {
    fontSize: 25,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  email: {
    marginTop: 3,
    fontSize: 20,
    color: 'gray',
  },
  number_view: {
    flex: 1.5,
    backgroundColor: '#333f50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
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
    padding: 10,
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
    padding: 20,
  },
  badge_icon: {
    width: 60,
    height: 60,
    marginLeft: 30,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#333f50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge_button: {
    marginLeft: 20,
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
  section: {
    backgroundColor: 'white',
    marginBottom: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#666',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#f44336',
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  photo: {
    width: 70,
    height: 70,
    marginLeft: 25,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default Profile;