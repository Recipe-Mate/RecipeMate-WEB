import React, { createContext, useState, useContext, useEffect } from 'react';
import apiConfig from '../../config/api.config';

// AuthContext 생성
const AuthContext = createContext();

// AuthContext Hook 생성
export const useAuth = () => useContext(AuthContext);

// AuthProvider 컴포넌트
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 서버 연결 없이 기본적으로 인증되지 않은 상태로 시작
        // 실제 서버 연동 시에는 토큰 유효성 검사 등의 로직 추가 필요
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      } catch (error) {
        console.error('인증 상태 확인 중 오류:', error);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 로그인 함수
  const login = async (email, password) => {
    try {
      const url = `${apiConfig.getApiUrl()}/api/login`;
      console.log('[로그인] 요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('로그인 실패');
      }

      const data = await response.json();

      // 사용자 정보 저장
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('로그인 중 오류:', error);
      return { success: false, error: error.message };
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      // 서버 연결 없이 로컬 상태만 변경
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      return { success: false, error: error.message };
    }
  };

  // 회원가입 함수
  const register = async (userData) => {
    try {
      const url = `${apiConfig.getApiUrl()}/api/signup`;
      console.log('[회원가입] 요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '회원가입 실패');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('회원가입 중 오류:', error);
      return { success: false, error: error.message };
    }
  };

  // 컨텍스트 값 제공
  const contextValue = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};