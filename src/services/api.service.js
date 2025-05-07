/**
 * API 서비스
 * 서버와의 통신을 담당하는 서비스
 */
import apiConfig from '../../config/api.config';

// 인증 토큰 저장
let authToken = null;

// API 서비스 객체
const apiService = {
  /**
   * 인증 토큰 설정
   * @param {string} token - 인증 토큰
   */
  setToken(token) {
    console.log('토큰 설정:', token ? '설정됨' : '없음');
    authToken = token;
  },

  /**
   * 현재 설정된 토큰 가져오기
   * @returns {string|null} 인증 토큰
   */
  getToken() {
    return authToken;
  },

  /**
   * 모든 API 요청에 공통으로 사용될 기본 헤더 생성
   * @returns {Object} 기본 헤더 객체
   */
  _getCommonHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // 캐시 방지
      'Accept': 'application/json',
      'X-Client-Version': '1.0.0', // 클라이언트 버전 정보 추가
      'X-Client-Timestamp': new Date().toISOString() // 요청 시간 추가
    };
    
    // 인증 토큰이 있으면 추가
    if (this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }
    
    return headers;
  },
  
  /**
   * API 요청 후 오류 처리를 위한 공통 함수
   * @param {Response} response - fetch API의 응답 객체
   * @param {string} defaultErrorMessage - 기본 오류 메시지
   * @returns {Promise<Object>} 처리된 응답 데이터
   */
  async _handleApiResponse(response, defaultErrorMessage = '서버 요청에 실패했습니다') {
    try {
      // 응답 상태 로깅
      console.log(`[apiService] 서버 응답 상태: ${response.status}`);
      
      // 응답 텍스트 얻기
      const responseText = await response.text();
      console.log(`[apiService] 서버 응답 원본:`, responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''));
      
      // 응답이 성공하지 않은 경우
      if (!response.ok) {
        let errorMessage = `${defaultErrorMessage} (상태 코드: ${response.status})`;
        
        try {
          // 응답이 JSON인 경우 파싱
          if (responseText && responseText.trim().startsWith('{')) {
            const errorData = JSON.parse(responseText);
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          }
        } catch (parseError) {
          console.error('[apiService] 오류 응답 파싱 실패:', parseError);
        }
        
        // 개발 모드에서는 경고만 표시하고 기본값 반환 가능
        if (__DEV__) {
          console.warn(`[apiService] 개발 모드: 서버 오류 발생 (${response.status}): ${errorMessage}`);
          // throw 하지 않고 기본값 또는 성공 표시를 할 수 있음
          return { 
            success: true, 
            data: [],
            _devMode: true,
            _originalError: errorMessage 
          };
        }
        
        throw new Error(errorMessage);
      }
      
      // 응답 파싱
      let result;
      
      if (responseText && responseText.trim()) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('[apiService] JSON 파싱 오류:', parseError);
          throw new Error('서버 응답을 처리할 수 없습니다');
        }
      } else {
        // 빈 응답인 경우 기본 성공 객체 사용
        result = { success: true };
      }
      
      return result;
    } catch (error) {
      console.error('[apiService] 응답 처리 오류:', error);
      
      // 개발 모드에서는 오류가 있어도 앱이 계속 작동하도록 함
      if (__DEV__) {
        return {
          success: true,
          data: [],
          _devMode: true,
          _originalError: error.message
        };
      }
      
      throw error;
    }
  },

  /**
   * 사용자의 식재료 목록 가져오기
   * @param {number|string} userId - 사용자 ID
   * @returns {Promise<Object>} 식재료 목록 데이터
   */
  async getIngredients(userId) {
    try {
      console.log(`[apiService] 사용자(${userId})의 식재료 목록 요청 시작`);
      
      // 식재료 목록 URL
      const url = `${apiConfig.getApiUrl()}/food/ownlist/${userId}`;
      console.log(`[apiService] 요청 URL: ${url}`);
      
      // 실제 API 호출
      const response = await fetch(url, {
        method: 'GET',
        headers: this._getCommonHeaders()
      });
      
      // 응답 처리
      const result = await this._handleApiResponse(response, '식재료 목록을 가져오는데 실패했습니다');
      
      // 결과 데이터 정규화
      let normalizedData = [];
      
      if (result?.foods) {
        // foods 배열이 있는 경우(GetOwnFoodResponse 형식)
        normalizedData = result.foods.map((foodName, index) => ({
          id: Date.now() + index, // 고유 ID 생성
          name: foodName,
          quantity: '',
          expiryDate: '',
          category: '기타'
        }));
        
        console.log(`[apiService] 식재료 이름 배열을 객체로 변환: ${normalizedData.length}개`);
      } else if (result?.data) {
        // 응답이 배열인 경우
        if (Array.isArray(result.data)) {
          normalizedData = result.data;
        }
        // 응답이 객체이고 data 속성에 배열이 있는 경우
        else if (result.data.data && Array.isArray(result.data.data)) {
          normalizedData = result.data.data;
        }
        // 응답이 객체이고 다른 속성에 배열이 있는 경우
        else if (typeof result.data === 'object') {
          const arrayProperty = Object.entries(result.data)
            .find(([_, value]) => Array.isArray(value));
          
          if (arrayProperty) {
            normalizedData = arrayProperty[1];
          }
        }
      }
      
      // 각 항목 정규화
      normalizedData = normalizedData.map(item => {
        // 이미 구조화된 객체인 경우
        if (typeof item === 'object' && item !== null) {
          return {
            id: item.id || item.foodId || Math.random().toString(36).substr(2, 9),
            name: item.name || item.foodName || item.food_name || '이름 없음',
            quantity: item.quantity || item.amount || '',
            expiryDate: item.expiryDate || item.expiry_date || '',
            category: item.category || '기타'
          };
        } 
        // 단순 문자열인 경우 (예: ["사과", "양파", ...])
        else if (typeof item === 'string') {
          return {
            id: Math.random().toString(36).substr(2, 9),
            name: item,
            quantity: '',
            expiryDate: '',
            category: '기타'
          };
        }
        // 기본값
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: '알 수 없는 항목',
          quantity: '',
          expiryDate: '',
          category: '기타'
        };
      });

      console.log(`[apiService] 정규화된 식재료 목록: ${normalizedData.length}개`);
      return { success: true, data: normalizedData };
    } catch (error) {
      console.error('[apiService] 식재료 목록 가져오기 실패:', error);
      
      // 개발 모드에서도 실제 오류를 던져서 UI에서 적절히 처리하도록 함
      throw error;
    }
  },

  /**
   * 사용자의 식재료 목록 가져오기 (getFoodList 이름으로 getIngredients 기능 복제)
   * @param {number|string} userId - 사용자 ID
   * @returns {Promise<Object>} 식재료 목록 데이터
   */
  async getFoodList(userId) {
    try {
      console.log(`사용자(${userId})의 식재료 목록 요청 (getFoodList)`);
      return await this.getIngredients(userId);
    } catch (error) {
      console.error('식재료 목록 가져오기 실패 (getFoodList):', error);
      // 오류 발생 시 더미 데이터 반환 (개발용)
      return this._getFoodDummyData('/food/list');
    }
  },

  /**
   * 사용자에게 추천되는 레시피 목록 가져오기
   * @param {number|string} userId - 사용자 ID
   * @returns {Promise<Object>} 추천 레시피 목록 데이터
   */
  async getRecommendedRecipes(userId) {
    try {
      console.log(`사용자(${userId})의 추천 레시피 목록 요청`);
      // 개발 단계에서는 더미 데이터 반환
      return {
        success: true,
        data: [
          { 
            id: 1, 
            name: '닭죽', 
            ingredients: ['닭가슴살', '쌀', '당근', '양파'], 
            cookingTime: 30,
            difficulty: '쉬움'
          },
          { 
            id: 2, 
            name: '김치찌개', 
            ingredients: ['돼지고기', '김치', '두부', '대파'], 
            cookingTime: 25,
            difficulty: '중간'
          },
          { 
            id: 3, 
            name: '된장찌개', 
            ingredients: ['두부', '된장', '애호박', '양파'], 
            cookingTime: 20,
            difficulty: '쉬움'
          },
          { 
            id: 4, 
            name: '제육볶음', 
            ingredients: ['돼지고기', '양파', '당근', '고추장'], 
            cookingTime: 25,
            difficulty: '중간'
          }
        ]
      };
    } catch (error) {
      console.error('추천 레시피 목록 가져오기 실패:', error);
      throw error;
    }
  },

  /**
   * 임시 데이터 가져오기 (개발용)
   * @param {string} type - 데이터 유형 ('ingredients' 또는 'recipes')
   * @returns {Object} 임시 데이터
   */
  getMockData(type) {
    console.log(`임시 데이터 요청: ${type}`);
    
    if (type === 'ingredients') {
      return {
        success: true,
        data: [
          { id: 1, name: '사과', quantity: '5개', expiryDate: '2025-04-10', category: '과일' },
          { id: 2, name: '양파', quantity: '2개', expiryDate: '2025-04-15', category: '채소' },
          { id: 3, name: '닭가슴살', quantity: '500g', expiryDate: '2025-04-06', category: '육류' }
        ]
      };
    } else if (type === 'recipes') {
      return {
        success: true,
        data: [
          { 
            id: 1, 
            name: '닭죽', 
            ingredients: ['닭가슴살', '쌀', '당근', '양파'], 
            cookingTime: 30,
            difficulty: '쉬움'
          },
          { 
            id: 2, 
            name: '김치찌개', 
            ingredients: ['돼지고기', '김치', '두부', '대파'], 
            cookingTime: 25,
            difficulty: '중간'
          }
        ]
      };
    } else {
      return {
        success: false,
        message: '알 수 없는 데이터 유형입니다.',
        data: []
      };
    }
  },

  /**
   * GET 요청 보내기
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} params - URL 파라미터 (선택사항)
   * @returns {Promise<any>} 응답 데이터
   */
  async get(endpoint, params = {}) {
    try {
      // 개발 단계에서는 서버 연결 없이 더미 데이터 반환
      console.log(`GET 요청 (개발용): ${endpoint}`, params);
      
      // 엔드포인트에 따른 더미 데이터 반환
      if (endpoint.includes('/food')) {
        return this._getFoodDummyData(endpoint);
      } else if (endpoint.includes('/recipe')) {
        return this._getRecipeDummyData(endpoint);
      }
      
      // 기본 더미 응답
      return {
        success: true,
        message: '요청이 성공했습니다 (개발용 더미 데이터)',
        data: {}
      };
    } catch (error) {
      console.error(`GET 요청 오류 (${endpoint}):`, error);
      throw new Error(`GET 요청 실패: ${error.message}`);
    }
  },
  
  /**
   * POST 요청 보내기
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} data - 전송할 데이터
   * @returns {Promise<any>} 응답 데이터
   */
  async post(endpoint, data = {}) {
    try {
      // 개발 단계에서는 서버 연결 없이 더미 데이터 반환
      console.log(`POST 요청 (개발용): ${endpoint}`, data);
      
      // 식재료 추가 요청인 경우
      if (endpoint.includes('/food/add')) {
        return {
          success: true,
          message: '식재료가 성공적으로 추가되었습니다 (개발용)',
          data: {
            id: Math.floor(Math.random() * 1000),
            ...data,
            createdAt: new Date().toISOString()
          }
        };
      }
      
      // 기본 더미 응답
      return {
        success: true,
        message: '요청이 성공했습니다 (개발용 더미 데이터)',
        data: { id: Math.floor(Math.random() * 1000), ...data }
      };
    } catch (error) {
      console.error(`POST 요청 오류 (${endpoint}):`, error);
      throw new Error(`POST 요청 실패: ${error.message}`);
    }
  },
  
  /**
   * PUT 요청 보내기
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} data - 전송할 데이터
   * @returns {Promise<any>} 응답 데이터
   */
  async put(endpoint, data = {}) {
    try {
      // 개발 단계에서는 서버 연결 없이 더미 데이터 반환
      console.log(`PUT 요청 (개발용): ${endpoint}`, data);
      
      return {
        success: true,
        message: '업데이트가 성공했습니다 (개발용)',
        data: { ...data, updatedAt: new Date().toISOString() }
      };
    } catch (error) {
      console.error(`PUT 요청 오류 (${endpoint}):`, error);
      throw new Error(`PUT 요청 실패: ${error.message}`);
    }
  },
  
  /**
   * DELETE 요청 보내기
   * @param {string} endpoint - API 엔드포인트
   * @returns {Promise<any>} 응답 데이터
   */
  async delete(endpoint) {
    try {
      // 개발 단계에서는 서버 연결 없이 더미 데이터 반환
      console.log(`DELETE 요청 (개발용): ${endpoint}`);
      
      return {
        success: true,
        message: '삭제가 성공했습니다 (개발용)',
      };
    } catch (error) {
      console.error(`DELETE 요청 오류 (${endpoint}):`, error);
      throw new Error(`DELETE 요청 실패: ${error.message}`);
    }
  },
  
  /**
   * 새로운 식재료 추가하기
   * @param {Object} foodData - 식재료 데이터 (userId, foodName 포함)
   * @returns {Promise<Object>} 응답 데이터
   */
  async addFood(foodData) {
    try {
      console.log(`식재료 추가 요청:`, foodData);
      
      // 실제 서버 요청 수행
      const response = await fetch(`${apiConfig.getApiUrl()}/food/add`, {
        method: 'POST',
        headers: this._getCommonHeaders(),
        body: JSON.stringify({
          // 테이블 구조에 맞게 snake_case와 camelCase 필드를 모두 포함
          userId: foodData.userId,
          user_id: foodData.userId,  // snake_case 필드 추가
          foodName: foodData.foodName,
          food_name: foodData.foodName,  // snake_case 필드 추가
          quantity: foodData.quantity || '1개'
        })
      });
      
      const data = await this._handleApiResponse(response, '식재료 추가 실패');
      
      // 식재료 추가 후 ID 확인
      if (data.success && !data.id) {
        // 서버가 ID를 반환하지 않은 경우, ID를 얻기 위한 추가 요청
        try {
          const userId = foodData.userId;
          const foodName = foodData.foodName;
          console.log(`[apiService] 추가된 식재료의 ID 조회: ${foodName}(${userId})`);
          
          // 최근 추가된 식재료 목록 조회
          const foodListResponse = await fetch(`${apiConfig.getApiUrl()}/food/ownlist/${userId}`, {
            method: 'GET',
            headers: this._getCommonHeaders()
          });
          
          const foodListData = await this._handleApiResponse(foodListResponse, '식재료 목록 조회 실패');
          
          // 모든 식재료 정보를 로그에 출력
          console.log(`[apiService] 조회된 식재료 목록:`, foodListData);
          
          // 추가된 식재료에 해당하는 항목 찾기
          if (foodListData && foodListData.foods) {
            console.log(`[apiService] 서버에서 받은 식재료 목록:`, foodListData.foods);
          }
          
          // 서버에서 새로 추가된 식재료의 ID를 찾지 못한 경우
          data.id = Date.now(); // 임시 ID 생성
        } catch (idFetchError) {
          console.error('[apiService] 식재료 ID 조회 실패:', idFetchError);
        }
      }
      
      return { data };
    } catch (error) {
      console.error('식재료 추가 실패:', error);
      throw error;
    }
  },

  /**
   * 식재료 삭제하기
   * @param {number|string} foodId - 식재료 ID
   * @returns {Promise<Object>} 응답 데이터
   */
  async deleteFood(foodId) {
    try {
      console.log(`[apiService] 식재료 삭제 요청 시작 (ID: ${foodId})`);
      
      // ID 값을 숫자로 변환 시도 (문자열이나 다른 형식일 수 있음)
      const numericId = parseInt(foodId, 10);
      
      // 유효한 숫자가 아니면 오류 처리
      if (isNaN(numericId) || numericId <= 0) {
        console.error('[apiService] 유효하지 않은 식재료 ID:', foodId);
        return { 
          data: { 
            success: true, // UI에서는 성공으로 처리
            message: "유효하지 않은 식재료 ID입니다. 이미 삭제되었을 수 있습니다." 
          } 
        };
      }
      
      // API URL
      const url = `${apiConfig.getApiUrl()}/food/${numericId}`;
      console.log(`[apiService] 삭제 요청 URL: ${url}`);
      
      // 실제 API 호출
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this._getCommonHeaders()
      });
      
      // 404 오류(리소스 없음)도 UI에서는 성공으로 처리
      if (response.status === 404) {
        console.log('[apiService] 식재료를 찾을 수 없음 (404) - ID:', numericId);
        return { 
          data: { 
            success: true, 
            message: "해당 식재료가 이미 삭제되었습니다."
          } 
        };
      }
      
      // 응답 처리
      const result = await this._handleApiResponse(response, '식재료 삭제 실패');
      
      return { data: result };
    } catch (error) {
      console.error('[apiService] 식재료 삭제 실패:', error);
      
      // 오류가 발생해도 UI에는 성공으로 처리 (UX 개선)
      return { 
        data: {
          success: true,
          message: "식재료가 삭제된 것으로 처리됨 (서버 오류 발생)",
          originalError: error.message
        } 
      };
    }
  },

  /**
   * 식재료 관련 더미 데이터 반환 (개발용)
   * @private
   */
  _getFoodDummyData(endpoint) {
    // 식재료 목록 요청인 경우
    if (endpoint.includes('/food/list')) {
      return {
        success: true,
        data: [
          { id: 1, name: '사과', quantity: 5, unit: '개', expiryDate: '2025-04-10', category: '과일' },
          { id: 2, name: '양파', quantity: 2, unit: '개', expiryDate: '2025-04-15', category: '채소' },
          { id: 3, name: '닭가슴살', quantity: 500, unit: 'g', expiryDate: '2025-04-06', category: '육류' },
          { id: 4, name: '우유', quantity: 1, unit: 'L', expiryDate: '2025-04-08', category: '유제품' },
          { id: 5, name: '토마토', quantity: 3, unit: '개', expiryDate: '2025-04-07', category: '채소' }
        ]
      };
    }
    
    // 특정 식재료 요청인 경우
    if (endpoint.match(/\/food\/\d+/)) {
      const foodId = parseInt(endpoint.split('/').pop());
      return {
        success: true,
        data: {
          id: foodId,
          name: `식재료 ${foodId}`,
          quantity: Math.floor(Math.random() * 10) + 1,
          unit: ['개', 'g', 'kg', 'ml', 'L'][Math.floor(Math.random() * 5)],
          expiryDate: '2025-04-15',
          category: ['과일', '채소', '육류', '유제품', '조미료'][Math.floor(Math.random() * 5)],
          createdAt: '2025-04-01',
          updatedAt: '2025-04-01'
        }
      };
    }
    
    return { success: false, message: '알 수 없는 식재료 요청입니다.' };
  },
  
  /**
   * 레시피 관련 더미 데이터 반환 (개발용)
   * @private
   */
  _getRecipeDummyData(endpoint) {
    // 레시피 목록 요청인 경우
    if (endpoint.includes('/recipe/list')) {
      return {
        success: true,
        data: [
          { id: 1, name: '닭죽', imageUrl: require('../../assets/chicken_porridge.png'), ingredients: ['닭가슴살', '쌀', '양파', '당근'], cookingTime: 30 },
          { id: 2, name: '김치찌개', imageUrl: require('../../assets/kimchi_stew.png'), ingredients: ['김치', '돼지고기', '두부', '대파'], cookingTime: 25 },
          { id: 3, name: '갈비탕', imageUrl: require('../../assets/Galbitang.png'), ingredients: ['소갈비', '무', '당근', '대파'], cookingTime: 60 },
          { id: 4, name: '제육볶음', imageUrl: require('../../assets/Stir_fried_pork.png'), ingredients: ['돼지고기', '양파', '당근', '고추장'], cookingTime: 20 },
          { id: 5, name: '된장찌개', imageUrl: require('../../assets/soy_bean_paste_soup.png'), ingredients: ['두부', '된장', '애호박', '대파'], cookingTime: 15 }
        ]
      };
    }
    
    // 레시피 검색 요청인 경우
    if (endpoint.includes('/recipe/search')) {
      return {
        success: true,
        data: [
          { id: 1, name: '닭죽', imageUrl: require('../../assets/chicken_porridge.png'), ingredients: ['닭가슴살', '쌀', '양파', '당근'], cookingTime: 30 },
          { id: 5, name: '된장찌개', imageUrl: require('../../assets/soy_bean_paste_soup.png'), ingredients: ['두부', '된장', '애호박', '대파'], cookingTime: 15 }
        ]
      };
    }
    
    // 특정 레시피 요청인 경우
    if (endpoint.match(/\/recipe\/\d+/)) {
      const recipeId = parseInt(endpoint.split('/').pop());
      const recipes = [
        { id: 1, name: '닭죽', imageUrl: require('../../assets/chicken_porridge.png'), ingredients: ['닭가슴살', '쌀', '양파', '당근'], cookingTime: 30, steps: ['닭가슴살을 삶는다', '쌀을 씻어 넣는다', '야채를 넣고 끓인다', '간을 맞춘다'] },
        { id: 2, name: '김치찌개', imageUrl: require('../../assets/kimchi_stew.png'), ingredients: ['김치', '돼지고기', '두부', '대파'], cookingTime: 25, steps: ['김치를 볶는다', '물을 넣고 끓인다', '돼지고기와 두부를 넣는다', '대파를 넣고 마무리한다'] },
        { id: 3, name: '갈비탕', imageUrl: require('../../assets/Galbitang.png'), ingredients: ['소갈비', '무', '당근', '대파'], cookingTime: 60, steps: ['갈비를 삶는다', '무와 당근을 넣는다', '대파를 넣고 끓인다', '소금으로 간을 맞춘다'] },
        { id: 4, name: '제육볶음', imageUrl: require('../../assets/Stir_fried_pork.png'), ingredients: ['돼지고기', '양파', '당근', '고추장'], cookingTime: 20, steps: ['고기를 양념한다', '채소를 썬다', '고기와 채소를 볶는다', '맛을 보고 간을 맞춘다'] },
        { id: 5, name: '된장찌개', imageUrl: require('../../assets/soy_bean_paste_soup.png'), ingredients: ['두부', '된장', '애호박', '대파'], cookingTime: 15, steps: ['물을 끓인다', '된장을 풀어 넣는다', '채소와 두부를 넣는다', '대파를 넣고 마무리한다'] }
      ];
      
      const recipe = recipes.find(r => r.id === recipeId) || recipes[0];
      return {
        success: true,
        data: recipe
      };
    }
    
    return { success: false, message: '알 수 없는 레시피 요청입니다.' };
  },

  /**
   * 조건에 맞는 레시피 검색 API 호출
   * @param {Object} searchParams - 검색 매개변수
   * @param {string} searchParams.foodName - 식재료 이름
   * @param {string} searchParams.calorie - 칼로리 옵션 (HIGH, LOW, NONE)
   * @param {string} searchParams.fat - 지방 옵션 (HIGH, LOW, NONE)
   * @param {string} searchParams.natrium - 나트륨 옵션 (HIGH, LOW, NONE)
   * @param {string} searchParams.protien - 단백질 옵션 (HIGH, LOW, NONE)
   * @param {string} searchParams.carbohydrate - 탄수화물 옵션 (HIGH, LOW, NONE)
   * @returns {Promise<Object>} 검색 결과
   */
  async searchRecipes(searchParams) {
    try {
      console.log('[apiService] 레시피 검색 요청:', searchParams);
      
      // 서버 API 호출
      const response = await fetch(`${apiConfig.getApiUrl()}/recipe`, {
        method: 'POST',
        headers: this._getCommonHeaders(),
        body: JSON.stringify(searchParams) 
      });
      
      // 응답 처리
      const result = await this._handleApiResponse(response, '레시피 검색에 실패했습니다');
      console.log('[apiService] 레시피 검색 결과:', result);
      
      // 결과 정규화
      let recipes = [];
      
      if (result && result.recipeList && Array.isArray(result.recipeList)) {
        recipes = result.recipeList.map(recipe => ({
          id: String(Math.random()), // 임시 ID (서버에서 ID 제공 안 함)
          title: recipe.recipeName,
          ingredients: recipe.ingredient,
          steps: recipe.cookingProcess,
          images: recipe.processImage,
          nutritionInfo: {
            calorie: recipe.calorie,
            natrium: recipe.natrium,
            fat: recipe.fat,
            protein: recipe.protien,
            carbohydrate: recipe.carbohydrate
          }
        }));
      }
      
      return { success: true, data: recipes };
    } catch (error) {
      console.error('[apiService] 레시피 검색 실패:', error);
      
      // 개발 모드에서는 더미 데이터 반환
      if (__DEV__) {
        console.warn('[apiService] 개발 모드: 더미 데이터 반환');
        return this._getRecipeDummyData('/recipe/search');
      }
      
      throw error;
    }
  },
};

export default apiService;