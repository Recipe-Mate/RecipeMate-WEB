import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../src/context/AuthContext';
import { clearToken } from '../src/services/api.service';
import apiService from '../src/services/api.service';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Profile 컴포넌트: 사용자 프로필 화면을 렌더링함
const Profile = ({ navigation: navFromProps }) => {
  const navigation = navFromProps || useNavigation();
  const { user, logout, setUser } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!user?.id) return;
        const res = await apiService.getUserInfo(user.id);
        if (res && (res.nickname || res.email)) {
          const userObj = { ...res, id: res.id || res.userId, profile: res.profile || '' };
          setUser(userObj);
          await AsyncStorage.setItem('user', JSON.stringify(userObj));
        }
      } catch (e) {
        console.warn('유저 정보 갱신 실패:', e);
      }
    };
    const unsubscribe = navigation.addListener('focus', fetchUser);
    return unsubscribe;
  }, [navigation, user?.id, setUser]);

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
      <View style={{alignItems: 'center'}}>
        <Text style={{fontSize:25, marginVertical: 20, fontWeight: 'bold', color: '#fff'}}>프로필</Text>
      </View>
      {/* 상단 Toss-style 프로필 카드 */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.profilePhotoWrap}>
            <View style={styles.profilePhotoShadow}>
              {user?.profile ? (
                <Image source={{ uri: user.profile }} style={styles.photo} />
              ) : (
                <View style={styles.photo}>
                  <Icon name="person" size={40} color="#ffffff" />
                </View>
              )}
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{user?.nickname || '닉네임'}</Text>
            <Text style={styles.email}>{user?.email || '이메일'}</Text>
          </View>
        </View>
      </View>

      {/* Toss-style 배지 카드 */}
      <View style={styles.badgeCard}>
        <Text style={styles.badgeTitle}>획득한 배지</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badgeIconWrap}>
            <Icon name="star" size={30} color="#FFD700" />
            <Text style={styles.badgeLabel}>스타터</Text>
          </View>
          <View style={styles.badgeIconWrap}>
            <Icon name="local-dining" size={30} color="#50C4B7" />
            <Text style={styles.badgeLabel}>요리왕</Text>
          </View>
          <View style={styles.badgeIconWrap}>
            <Icon name="emoji-events" size={30} color="#FFB300" />
            <Text style={styles.badgeLabel}>챌린저</Text>
          </View>
          <TouchableOpacity style={styles.badgeAddButton} onPress={() => navigation.navigate('Badge')}>
            <Icon name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 메뉴 카드: 계정/앱 관리 */}
      <View style={styles.menuCard}>
        <Text style={styles.menuSectionTitle}>계정 관리</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditProfile')}>
          <Icon name="edit" size={20} color="#2D336B" style={styles.menuIcon} />
          <Text style={styles.menuText}>프로필 수정</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.menuCard}>
        <Text style={styles.menuSectionTitle}>앱 설정</Text>
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="notifications" size={20} color="#2D336B" style={styles.menuIcon} />
          <Text style={styles.menuText}>알림 설정</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Icon name="language" size={20} color="#2D336B" style={styles.menuIcon} />
          <Text style={styles.menuText}>언어 설정</Text>
        </TouchableOpacity>
      </View>

      {/* 로그아웃/탈퇴 버튼 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.withdrawButton} onPress={() => Alert.alert('준비 중', '탈퇴 기능은 준비 중입니다.')}>
        <Text style={styles.withdrawText}>탈퇴하기</Text>
      </TouchableOpacity>

      <StatusBar barStyle="dark-content" />
    </ScrollView>
  );
};

// 스타일 정의함
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7886C7',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    margin: 18,
    marginTop: -3,
    marginBottom: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhotoWrap: {
    marginRight: 18,
  },
  profilePhotoShadow: {
    shadowColor: '#50C4B7',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 4,
    borderRadius: 40,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2D336B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nickname: {
    fontSize: 22,
    color: '#222',
    fontWeight: '700',
    marginBottom: 2,
  },
  email: {
    fontSize: 15,
    color: '#888',
    fontWeight: '400',
  },
  badgeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D336B',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  badgeIconWrap: {
    alignItems: 'center',
    marginRight: 18,
  },
  badgeLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },
  badgeAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2D336B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#50C4B7',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 2,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 15,
    paddingVertical: 8,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D336B',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 18,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '400',
  },
  logoutButton: {
    marginHorizontal: 18,
    backgroundColor: '#2D336B',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  withdrawButton: {
    marginHorizontal: 18,
    marginTop: 10,
    marginBottom: 30,
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  withdrawText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Profile;