import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthRequest } from 'expo-auth-session'; // expo-auth-session에서 useAuthRequest 훅 사용
import { KAKAO_REST_API_KEY, KAKAO_REDIRECT_URI, SERVER_URL } from '@env';
import * as AuthSession from 'expo-auth-session';

const redirectUri = AuthSession.makeRedirectUri({
  useProxy: true, // 개발 시에는 true, 배포 시에는 false
});
const LogIn = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false); // 요청 중 상태 관리
  const [errorText, setErrorText] = useState('');

  const authorizationEndpoint = 'https://kauth.kakao.com/oauth/authorize';
  const tokenEndpoint = `${SERVER_URL}/auth/token`; // 서버 URL에 맞게 수정

  // 로그인 URL
  // const loginUrl = `${authorizationEndpoint}?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;

  // useAuthRequest 훅을 최상위에서 호출하여 훅의 호출 순서를 보장
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: KAKAO_REST_API_KEY, // 카카오 REST API 키
      redirectUri: KAKAO_REDIRECT_URI, // 카카오 개발자 콘솔에 등록된 리디렉션 URI
      responseType: 'code', // OAuth 2.0 인가 코드 플로우 사용
    },
    {
      authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
      tokenEndpoint: 'https://kauth.kakao.com/oauth/token', // 카카오 서버에서 토큰 받기
    }
  );
  
  console.log(redirectUri);
  const handleLogin = useCallback(async () => {
    if (isLoading || !request) {
      console.log('요청 준비 안 됨');
      return;
    }
  
    setIsLoading(true);
  
    try {
      console.log('카카오 로그인 요청 시작...');
      // promptAsync 호출 전 로그 추가
      console.log('request 상태:', request);
      console.log('response 상태:', response);

      const result = await promptAsync({ useProxy: true }); // 로그인 요청을 보냄
      console.log('카카오 로그인 결과:', result); // 이 로그가 제대로 출력되는지 확인
      console.log('카카오 로그인 응답 전체:', result);
      console.log('리디렉션된 URI:', result?.url);
      console.log(redirectUri);
      if (result?.url) {
        const code = new URL(result.url).searchParams.get('code'); // 리디렉션된 URL에서 'code' 값 추출
        console.log('인가 코드:', code);

        if (!code) {
          throw new Error('인가 코드가 없습니다.');
        }

        // 서버에 요청을 보내기 전, 인가 코드를 포함한 요청 보내기
        const serverResponse = await fetch(`${SERVER_URL}/auth?code=${code}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: KAKAO_REST_API_KEY,
            redirect_uri: KAKAO_REDIRECT_URI,
            code: code, // 실제 'code' 값 사용
          }),
        });

        console.log('HTTP 응답 상태:', serverResponse.status);
        const tokenData = await serverResponse.json();
        console.log('응답 JSON 본문:', tokenData);
      } else {
        console.error('카카오 로그인에서 응답을 받지 못했습니다.');
      }
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      setErrorText('로그인 실패. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, request, response]);

  useEffect(() => {
    // 응답 상태에 대한 로그 출력
    if (response) {
      console.log('카카오 로그인 응답 상태:', response);

      if (response?.type === 'success') {
        const { code } = response.params;
        console.log('인가 코드 확인:', code);
      }
    }
  }, [response]);

  return (
    <View style={styles.container}>
      {isLoading ? <ActivityIndicator size="large" color="#333f50" /> : null}
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>카카오 로그인</Text>
      </TouchableOpacity>
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
});

export default LogIn;
