import React from 'react';
import { Alert } from 'react-native';
import apiConfig from '../config/api.config';

const SignupScreen = ({ navigation }) => {
  // 회원가입 처리 함수
  const signUp = async (userData) => {
    try {
      const url = `${apiConfig.getApiUrl()}/api/signup`;
      console.log('[회원가입] 요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        // 회원가입 성공 처리
        navigation.replace('Login');
      } else {
        throw new Error(result.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('[회원가입] 오류:', error);
      Alert.alert('회원가입 실패', error.message);
    }
  };

  // 컴포넌트 렌더링 부분 생략...
  
  return null; // 실제 구현에 맞게 수정 필요
};

export default SignupScreen;
