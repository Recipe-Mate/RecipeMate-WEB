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
   * 사용자의 식재료 목록 가져오기
   * @param {number|string} userId - 사용자 ID
   * @returns {Promise<Object>} 식재료 목록 데이터
   */
  async getIngredients(userId) {
    try {
      console.log(`사용자(${userId})의 식재료 목록 요청`);
      
      // 실제 API 호출
      const response = await fetch(`${apiConfig.getApiUrl()}/food/ownlist/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('식재료 목록을 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('식재료 목록 가져오기 실패:', error);
      
      // 오류 발생 시 더미 데이터 반환 (개발용)
      return this._getFoodDummyData('/food/list');
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        },
        body: JSON.stringify({
          // 테이블 구조에 맞게 snake_case와 camelCase 필드를 모두 포함
          userId: foodData.userId,
          user_id: foodData.userId,  // snake_case 필드 추가
          foodName: foodData.foodName,
          food_name: foodData.foodName,  // snake_case 필드 추가
          quantity: foodData.quantity || '1개'
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`서버 응답 오류 (${response.status}):`, errorText);
        throw new Error(`식재료 추가 실패 (상태 코드: ${response.status})`);
      }
      
      const data = await response.json();
      console.log('서버 응답 데이터:', data);
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
      console.log(`식재료 삭제 요청 (ID: ${foodId})`);
      
      // 실제 API 호출
      const response = await fetch(`${apiConfig.getApiUrl()}/food/${foodId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`식재료 삭제 실패 (상태 코드: ${response.status})`);
      }
      
      return { 
        data: {
          success: true,
          message: "식재료가 삭제되었습니다"
        }
      };
    } catch (error) {
      console.error('식재료 삭제 실패:', error);
      // 오류 발생 시 더미 성공 응답 반환 (개발용)
      return { 
        data: {
          success: true,
          message: "개발 모드: 식재료가 삭제되었습니다 (더미 응답)"
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
  }
};

export default apiService;