/**
 * API 설정 파일
 * 서버 URL 및 API 관련 설정 관리
 */

// 기본 서버 URL을 8081 포트로 변경
const DEFAULT_API_URL = 'http://localhost:8081';

// API 설정을 관리하는 객체
const apiConfig = {
  // 현재 API URL
  apiUrl: DEFAULT_API_URL,
  
  // API URL 획득
  getApiUrl() {
    return this.apiUrl;
  },
  
  // 서버 설정 초기화 (서버에서 설정 가져오기)
  async initializeServerConfig() {
    try {
      // 서버가 준비되지 않았으므로 더미 구현
      console.log('서버 설정 초기화 - 서버 연결 없이 실행 중');
      
      // 성공 반환
      return { success: true, message: '서버 설정 완료' };
    } catch (error) {
      console.error('서버 설정 초기화 실패:', error);
      // 실패해도 기본 URL 사용하여 계속 진행
      return { success: false, message: '서버 설정 실패, 기본 URL 사용' };
    }
  }
};

export default apiConfig;