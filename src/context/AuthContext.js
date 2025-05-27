import React, { createContext, useContext, useState } from 'react';

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
      setIsRegistering(false);  // 로그인 성공 시 등록 상태를 false로
    } else {
      console.log('회원가입이 완료되지 않았습니다.');
      setIsRegistering(true);  // 회원가입 상태로 설정
    }
  };

  // 로그아웃 함수
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setIsRegistering(false);  // 로그아웃 시 등록 상태 초기화
  };

  // 회원가입 처리를 위한 함수 (필요시 추가)
  const register = (userData) => {
    // 회원가입 처리 로직 (예: 서버에 요청 후 성공하면 로그인)
    console.log('회원가입 처리 중...');
    setIsAuthenticated(true);
    setUser(userData);
    setIsRegistering(false);  // 회원가입 후 로그인 상태로 전환
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, login, logout, isRegistering, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
