import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI, SERVER_URL } from '@env';
import { useAuth } from '../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = ({ navigation }) => { // navigation prop 추가
  const [showWebView, setShowWebView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const webviewRef = useRef(null);
  const { login } = useAuth();

  const REDIRECT_URI = `${KAKAO_REDIRECT_URI}`;
  const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;
  console.log('KAKAO_AUTH_URL:', KAKAO_AUTH_URL);

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
      const fetchUrl = `${SERVER_URL}/api/auth`;
      console.log('fetch 주소:', fetchUrl);
      const getTokenResponse = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
  
      if (!getTokenResponse.ok) throw new Error('토큰 요청 실패');
  
      const data = await getTokenResponse.json();
      console.log('[카카오 로그인] 서버 응답 전체:', JSON.stringify(data, null, 2));
      const isRegistered = data.isRegistered;
      // 수정: 백엔드에서 내려주는 필드명에 맞게 파싱
      console.log('Access Token:', data.access_token);
      console.log('Refresh Token: ', data.refresh_token);
      console.log('userId: ', data.user_id);

      if (data.access_token) {
        console.log('[카카오 로그인] accessToken 저장');
        await AsyncStorage.setItem('accessToken', data.access_token);
        if (data.refresh_token) {
          await AsyncStorage.setItem('refreshToken', data.refresh_token);
        }
        if (data.user_id) {
          await AsyncStorage.setItem('userId', String(data.user_id));
        }
        // userData에 token 필드 추가해서 login 호출
        console.log('[카카오 로그인] login() 호출:', { ...data, token: data.access_token });
        login({
          ...data,
          token: data.access_token
        });
      } else {
        throw new Error('access_token이 누락되었습니다.');
      }
  
      // 예시로 refreshToken 유효성 확인
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const accessToken = await AsyncStorage.getItem('accessToken');

      const checkAccessToken = await fetch(`${SERVER_URL}/api/auth/token/health`, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'token': `${refreshToken}`,
        },
        body: '',
      });
      
      const accessTokenData = await checkAccessToken.json();
      console.log('리프레시 서버 응답: ', accessTokenData);

      if (accessTokenData.status === 401) {
        console.log('Access token expired, refreshing...');
        
        const refreshAccessToken = await fetch(`${SERVER_URL}/auth/token`, {
          method: 'POST',
          headers: {
            'accept': '*/*',
            'refreshToken': refreshToken,
          },
          body: '',
        });
        
        const refreshData = await refreshAccessToken.json();
        console.log('refresh 후 응답:', refreshData);
        await AsyncStorage.setItem('accessToken', refreshData.accessToken);
        await AsyncStorage.setItem('refreshToken', refreshData.refreshToken);

        console.log('refresh 후 accessToken: ', accessToken);
        console.log('refresh 후 refreshToken: ', refreshToken);
      }

      if (isRegistered === true) {
        // user 객체가 없으면 생성해서 넘김
        const userObj = data.user || {
          id: data.user_id,
          name: data.user_name,
          kakao_id: data.kakao_id,
          email: data.email,
        };
        console.log('[카카오 로그인] isRegistered=true, login() 호출:', {
          ...data,
          user: userObj,
          id: data.user_id,
          kakao_id: data.kakao_id || data.user_id
        });
        login({
          ...data,
          user: userObj, // 항상 user 객체로 넘김
          id: data.user_id, // DB PK
          kakao_id: data.kakao_id || data.user_id // 카카오ID(백엔드에서 kakao_id가 없으면 user_id 그대로)
        });
      } else {
        setErrorText('등록되지 않은 카카오 계정입니다.');
      }
  
    } catch (error) {
      console.error('[카카오 로그인] 실패:', error);
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