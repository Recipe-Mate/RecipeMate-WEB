// Import React and Component
import React, {useState, useEffect} from 'react';
import {ActivityIndicator, View, StyleSheet, Image, Alert, ToastAndroid, Platform, BackHandler} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api.config';

// SplashScreen 컴포넌트: 앱 시작 시 사용자 인증 상태를 확인하는 화면
const SplashScreen = ({navigation}) => {
  // State for ActivityIndicator animation
  const [animating, setAnimating] = useState(true); // 애니메이션 상태 관리함

  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
    // iOS의 경우 Alert 사용
    else {
      Alert.alert('알림', message);
    }
  };

  const checkServerConnection = async () => {
    try {
        const healthUrl = `${API_BASE_URL}/health`;
        console.log('Checking server health at:', healthUrl);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Server response:', result);

        if (result.status === 'UP' && result.message === 'OK') {
            console.log('서버 연결 성공');
            showToast('서버에 연결되었습니다.');
            navigation.replace('Auth');
        } else {
            throw new Error('서버 응답이 올바르지 않습니다');
        }
    } catch (error) {
        console.error('Connection error:', error.message || '알 수 없는 오류');
        if (error.name === 'AbortError') {
            Alert.alert('연결 시간 초과', '서버 응답이 너무 늦습니다.');
        } else {
            Alert.alert(
                '서버 연결 실패',
                '서버에 연결할 수 없습니다. 다시 시도하시겠습니까?',
                [
                    {
                        text: '재시도',
                        onPress: () => {
                            setAnimating(true);
                            setTimeout(checkServerConnection, 1000);
                        }
                    },
                    {
                        text: '종료',
                        onPress: () => BackHandler.exitApp(),
                        style: 'cancel'
                    }
                ]
            );
        }
    }
  };

  // 컴포넌트가 마운트될 때 실행됨
  useEffect(() => {
    const initializeApp = async () => {
        try {
            await checkServerConnection();
        } finally {
            setAnimating(false);
        }
    };

    const timeoutId = setTimeout(initializeApp, 2000);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <View style={styles.container}>
      {/* 로딩 애니메이션 표시 */}
      {/* <Image
        source={require('../src/viva-logo-with-txt.png')}
        style={{width: wp(55), resizeMode: 'contain', margin: 30}}
      /> */}
      <ActivityIndicator
        animating={animating} // 애니메이션 상태
        color="#6990F7" // 로딩 아이콘 색상
        size="large" // 아이콘 크기 설정
        style={styles.activityIndicator} // 스타일 적용
      />
    </View>
  );
};

export default SplashScreen; // SplashScreen 컴포넌트를 외부로 내보냄

// 스타일 정의함
const styles = StyleSheet.create({
  container: {
    flex: 1, // 화면 전체를 차지함
    alignItems: 'center', // 가로 중앙 정렬
    justifyContent: 'center', // 세로 중앙 정렬
    backgroundColor: 'white', // 배경색 설정
  },
  activityIndicator: {
    height: 80, // 아이콘 영역 높이 설정
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20
  },
});