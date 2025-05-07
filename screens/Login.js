import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI, SERVER_URL } from '@env';
import { useAuth } from '../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = () => {
  const [showWebView, setShowWebView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const webviewRef = useRef(null);
  const { login } = useAuth();

  const REDIRECT_URI = `${KAKAO_REDIRECT_URI}`;
  const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

  const handleLogin = () => {
    setShowWebView(true);  // 버튼 누르면 WebView 표시
  };

  const handleNavigationChange = (navState) => {
    const url = navState.url;
    if (url.startsWith(REDIRECT_URI)) {
      const match = url.match(/code=([^&]+)/);
      const code = match?.[1];
      if (code) {
        console.log('카카오 인가코드:', code);
        sendCodeToBackend(code);
        setShowWebView(false);  // WebView 닫기
      }
    }
  };

  const sendCodeToBackend = async (code) => {
    try {
      setIsLoading(true);
      const getTokenResponse = await fetch(`${SERVER_URL}/auth?code=${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: JSON.stringify({ code }),
      });
  
      if (!getTokenResponse.ok) throw new Error('토큰 요청 실패');
  
      const data = await getTokenResponse.json();
      const isRegistered = data.isRegistered;
      console.log('데이터:', data);
      console.log('Access Token:', data.accessToken);
      console.log('Refresh Token: ', data.refreshToken);
      console.log('userId: ', data.userId)
  
      if (data.accessToken && data.refreshToken) {
        await AsyncStorage.setItem('accessToken', data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
        await AsyncStorage.setItem('userId', String(data.userId));
      } else {
        throw new Error('토큰이 누락되었습니다.');
      }      
  
      // 예시로 refreshToken 유효성 확인
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const accessToken = await AsyncStorage.getItem('accessToken');

      const checkAccessToken = await fetch(`${SERVER_URL}/auth/token/health`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'token': `${refreshToken}`, // 실제 토큰 값으로 교체하세요
        },
        body: '', // curl에서 -d ''이므로 빈 문자열 전송
      });
      

      const accessTokenData = await checkAccessToken.json();
      console.log('리프레시 서버 응답: ', accessTokenData);
      // console.log('리프레시토큰 유효한지 확인: ', accessTokenData.tokenHealth);

      if (accessTokenData.status === 401) {
        console.log('Access token expired, refreshing...');
        
        const refreshAccessToken = await fetch(`${SERVER_URL}/auth/token`, {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'refreshToken': refreshToken,
          },
          body: '', // curl에서 -d ''인 부분
        });
        
        const refreshData = await refreshAccessToken.json();
        console.log('refresh 후 응답:', refreshData);
        await AsyncStorage.setItem('accessToken', refreshData.accessToken);
        await AsyncStorage.setItem('refreshToken', refreshData.refreshToken);

        console.log('refresh 후 accessToken: ', accessToken);
        console.log('refresh 후 refreshToken: ', refreshToken);

      }

      if (isRegistered === true) {
        login(data);
      } else {
        setErrorText('등록되지 않은 사용자입니다.');
      }
  
    } catch (error) {
      console.error('카카오 로그인 실패: ', error);
      setErrorText('로그인 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <View style={{ flex: 1 }}>
      {showWebView ? (
        <WebView
          style={{ flex: 1 }}
          ref={webviewRef}
          source={{ uri: KAKAO_AUTH_URL }}
          onNavigationStateChange={handleNavigationChange}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
        />
      ) : (
        <View style={styles.container}>
          {isLoading && <ActivityIndicator size="large" color="#333f50" />}
          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>카카오 로그인</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FBE301",
    borderRadius: 10,
    borderWidth: 1,
    width: 250,
    height: 50,
    marginTop: 10,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#3B1E1E',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default Login;
