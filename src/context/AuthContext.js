import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);  // 회원가입 상태 추가

  // 로그인 함수
  const login = (userData) => {
    if (userData.isRegistered) {
      setIsAuthenticated(true);
      setUser(userData);
      setIsRegistering(false);
      // JWT 토큰이 있으면 apiService에 등록 (값 검증)
      // 1. access_token 우선, 2. token(문자열) 허용, 3. token(객체)에서 access_token 추출
      let jwt = null;
      if (typeof userData.access_token === 'string' && userData.access_token.length > 0) {
        jwt = userData.access_token;
      } else if (typeof userData.token === 'string' && userData.token.length > 0) {
        jwt = userData.token;
      } else if (userData.token && typeof userData.token === 'object' && typeof userData.token.access_token === 'string' && userData.token.access_token.length > 0) {
        jwt = userData.token.access_token;
      }
      if (jwt) {
        apiService.setToken(jwt);
        AsyncStorage.setItem('accessToken', jwt); // JWT를 AsyncStorage에 저장
      } else {
        apiService.setToken(null);
        AsyncStorage.removeItem('accessToken'); // 유효하지 않은 경우 AsyncStorage에서 토큰 제거
        console.warn('잘못된 JWT 토큰:', userData.token, userData.access_token);
      }
    } else {
      console.log('회원가입이 완료되지 않았습니다.');
      setIsRegistering(true);
    }
  };

  // 로그아웃 함수
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setIsRegistering(false);
    apiService.setToken(null); // 토큰 초기화
    AsyncStorage.removeItem('accessToken'); // AsyncStorage에서 토큰 제거
  };

  // 회원가입 처리 함수 (필요시 추가)
  const register = (userData) => {
    // 회원가입 처리 로직 (예: 서버에 요청 후 성공하면 로그인)
    console.log('회원가입 처리 중...');
    setIsAuthenticated(true);
    setUser(userData);
    setIsRegistering(false);  // 회원가입 후 로그인 상태로 전환
  };

  // 앱 시작 시 AsyncStorage에서 토큰을 불러와 apiService에 등록
  useEffect(() => {
    (async () => {
      try {
        // 앱 시작 시 항상 로그아웃 상태로 시작하도록 수정
        // 기존 토큰이 있더라도 제거하고, 인증 상태를 false로 설정
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          console.log('[AuthContext] 앱 시작 시 AsyncStorage에 토큰이 있었으나, 로그인 유지 기능을 비활성화하여 제거합니다. 토큰:', token);
          await AsyncStorage.removeItem('accessToken');
        } else {
          console.log('[AuthContext] 앱 시작 시 AsyncStorage에 저장된 accessToken이 없습니다.');
        }
        
        apiService.setToken(null); // 항상 토큰 초기화
        setIsAuthenticated(false); // 항상 비인증 상태로 시작
        console.log('[AuthContext] 앱 시작 시 로그인 유지 기능 비활성화됨. 항상 로그아웃 상태로 시작합니다.');

      } catch (e) {
        console.error('[AuthContext] 앱 시작 처리 중 오류 발생 (로그인 유지 비활성화 로직):', e);
        apiService.setToken(null);
        setIsAuthenticated(false);
        // 오류 발생 시 만약을 위해 토큰 제거 시도
        try {
          await AsyncStorage.removeItem('accessToken');
          console.log('[AuthContext] 오류로 인해 AsyncStorage의 accessToken 제거 시도 완료 (로그인 유지 비활성화 로직).');
        } catch (removeError) {
          console.error('[AuthContext] 오류 후 accessToken 제거 중 추가 오류 (로그인 유지 비활성화 로직):', removeError);
        }
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, login, logout, isRegistering, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);