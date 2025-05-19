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
      // user 정보도 반드시 저장
      AsyncStorage.setItem('user', JSON.stringify(userData));
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

  // 사용자 정보 업데이트 함수 (닉네임, 프로필 이미지 등)
  const updateUser = async (updates) => {
    try {
      if (user && (user.id || user.userId)) {
        await apiService.updateUser(user.id || user.userId, updates);
      }
      setUser((prev) => {
        const newUser = {
          ...prev,
          ...updates,
          profile: updates.profile || prev.profile || ''
        };
        if (newUser.userId && !newUser.id) newUser.id = newUser.userId;
        return newUser;
      });
      const merged = { ...user, ...updates, profile: updates.profile || user.profile || '' };
      if (merged.userId && !merged.id) merged.id = merged.userId;
      await AsyncStorage.setItem('user', JSON.stringify(merged));
    } catch (e) {
      console.error('[AuthContext] updateUser 오류:', e);
      throw e;
    }
  };

  // 앱 시작 시 AsyncStorage에서 토큰과 유저 정보를 불러와 자동 로그인 및 유저 정보 복원
  useEffect(() => {
    // apiService에 logout 핸들러 등록 (토큰 만료 시 자동 로그아웃)
    apiService.setLogoutHandler(() => {
      setIsAuthenticated(false);
      setUser(null);
      setIsRegistering(false);
      apiService.setToken(null);
      AsyncStorage.removeItem('accessToken');
      AsyncStorage.removeItem('refreshToken');
      AsyncStorage.removeItem('user');
    });
    (async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('accessToken');
        const userStr = await AsyncStorage.getItem('user');
        if (token && userStr) {
          apiService.setToken(token);
          setIsAuthenticated(true);
          const parsed = JSON.parse(userStr);
          setUser({ ...parsed, id: parsed.id || parsed.userId });
        } else {
          // 토큰만 있거나 user 정보가 없으면 인증 처리하지 않음
          apiService.setToken(null);
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (e) {
        apiService.setToken(null);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, login, logout, isRegistering, register, updateUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);