/**
 * API 설정 파일
 * 서버 URL 및 API 관련 설정 관리
 */

// 기본 서버 URL 설정 - 실제 서버 IP 주소와 포트로 변경
const DEFAULT_API_URL = 'http://10.0.2.2:8081'; // 안드로이드 에뮬레이터에서 localhost 대신 사용
// iOS에서는 localhost 사용: const DEFAULT_API_URL = 'http://127.0.0.1:8081';

// API 엔드포인트 정의
const API_ENDPOINTS_OBJ = {
  USER_PROFILE: '/api/user',
  UPDATE_PROFILE: '/api/user/update',
  CHANGE_PASSWORD: '/api/user/password',
  DELETE_ACCOUNT: '/api/user/delete',
  STATISTICS: '/api/statistics',
  LOGIN: '/api/login',
  SIGNUP: '/api/signup'
};

// API 설정을 관리하는 객체
const apiConfig = {
  // 현재 API URL
  apiUrl: DEFAULT_API_URL,
  
  // 하위 호환성을 위한 BASE_URL 속성 추가
  BASE_URL: DEFAULT_API_URL,
  
  // API 엔드포인트 정의 추가
  API_ENDPOINTS: API_ENDPOINTS_OBJ,
  
  // API URL 획득
  getApiUrl() {
    return this.apiUrl;
  },
  
  // 서버 설정 초기화 (서버에서 설정 가져오기)
  async initializeServerConfig() {
    try {
      // 실제 서버 설정 가져오기 시도
      console.log('서버 설정 초기화 시도 중...');
      
      try {
        const response = await fetch(`${this.apiUrl}/api/system/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: 5000 // 5초 타임아웃
        });
        
        if (response.ok) {
          console.log('서버 연결 성공');
          return { success: true, message: '서버 설정 완료' };
        } else {
          throw new Error('서버 응답이 올바르지 않습니다');
        }
      } catch (fetchError) {
        console.warn('서버 연결 시도 실패:', fetchError.message);
        // 실패해도 기본 URL 사용하여 계속 진행
        return { success: false, message: '서버 설정 실패, 기본 URL 사용' };
      }
    } catch (error) {
      console.error('서버 설정 초기화 실패:', error);
      return { success: false, message: '서버 설정 실패, 기본 URL 사용' };
    }
  }
};

// 하위 호환성 위해 필요한 상수들 내보내기
export const API_BASE_URL = DEFAULT_API_URL;
export const API_ENDPOINTS = API_ENDPOINTS_OBJ; // 다른 변수로부터 내보내기

export default apiConfig;