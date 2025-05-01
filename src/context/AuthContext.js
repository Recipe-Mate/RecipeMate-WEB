import React, { createContext, useState, useContext, useEffect } from 'react';
import apiConfig from '../../config/api.config';
import { Alert } from 'react-native';

// AuthContext 생성
const AuthContext = createContext();

// AuthContext Hook 생성
export const useAuth = () => useContext(AuthContext);

// AuthProvider 컴포넌트
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false); // 로딩 상태를 기본적으로 false로 설정

  // 앱 시작 시 인증 상태를 백그라운드에서 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 서버 연결 없이 기본적으로 인증되지 않은 상태로 시작
        // 실제 서버 연동 시에는 토큰 유효성 검사 등의 로직 추가 필요
        setUser(null);
        setIsAuthenticated(false);
      } catch (error) {
        console.error('인증 상태 확인 중 오류:', error);
        setIsAuthenticated(false);
      }
    };

    // 백그라운드에서 인증 상태 확인 실행
    checkAuthStatus();
  }, []);

  // 로그인 함수
  const login = async (email, password) => {
    try {
      const url = `${apiConfig.getApiUrl()}/api/login`;
      console.log('[로그인] 요청 URL:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃 설정
      
      try {
        // 서버 API 구조에 맞게 email, password만 전송
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            password
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId); // 타임아웃 해제
        
        // 서버 응답 처리
        const data = await response.json();
        
        if (!response.ok) {
          console.log('[로그인] 응답 오류:', data);
          throw new Error(data.errorMessage || '로그인 실패');
        }
        
        // 로그인 성공 처리
        console.log('[로그인] 성공:', data);
        
        // 서버 응답 구조에 맞게 사용자 정보 저장
        // LoginResponse는 data 필드 내에 id와 email을 포함함
        const userData = {
          id: data.data.id,
          email: data.data.email
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('서버 응답 시간이 너무 오래 걸립니다.');
        }
        
        // fetch 과정에서 발생한 오류를 상위로 전파
        throw fetchError;
      }
    } catch (error) {
      console.error('로그인 중 오류:', error);
      
      // 네트워크 관련 오류 처리
      if (error.message && error.message.includes('Network request failed')) {
        return { 
          success: false, 
          error: '네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.' 
        };
      }
      
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
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
          signal: controller.signal
        });

        clearTimeout(timeoutId); // 타임아웃 해제
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: '회원가입 실패' }));
          throw new Error(errorData.message || '회원가입 실패');
        }

        const data = await response.json();
        return { success: true, data };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          throw new Error('서버 응답 시간이 너무 오래 걸립니다.');
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error('회원가입 중 오류:', error);
      
      // 네트워크 관련 오류 처리
      if (error.message && error.message.includes('Network request failed')) {
        return { 
          success: false, 
          error: '네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해주세요.' 
        };
      }
      
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