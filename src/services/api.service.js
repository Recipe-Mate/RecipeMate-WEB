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
      // 응답 상태 로그
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
          console.error('[apiService] 응답 파싱 오류:', parseError);
          result = responseText;
        }
      } else {
        result = {};
      }
      
      return result;
    } catch (error) {
      console.error('[apiService] API 응답 처리 중 오류:', error);
      throw error;
    }
  },

  /**
   * 로그인
   * @param {Object} data - { email, password }
   * @returns {Promise<Object>}
   */
  async login(data) {
    const url = `${apiConfig.getApiUrl()}/api/login`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this._getCommonHeaders(),
        body: JSON.stringify(data)
      });
      const result = await this._handleApiResponse(response, '로그인에 실패했습니다');
      // 토큰 저장 (예시)
      if (result.data && result.data.token) {
        this.setToken(result.data.token);
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 회원가입
   * @param {Object} data - { email, password, ... }
   * @returns {Promise<Object>}
   */
  async register(data) {
    const url = `${apiConfig.getApiUrl()}/api/signup`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this._getCommonHeaders(),
        body: JSON.stringify(data)
      });
      // 서버는 body가 없는 200 OK만 반환하므로, 성공 여부만 체크
      if (response.ok) {
        return { success: true };
      } else {
        // 실패 시 에러 메시지 파싱 시도
        let errorMsg = '회원가입에 실패했습니다';
        try {
          const text = await response.text();
          if (text && text.trim().startsWith('{')) {
            const err = JSON.parse(text);
            if (err.message) errorMsg = err.message;
          }
        } catch {}
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 서버 헬스 체크 (경로 수정)
   */
  async healthCheck() {
    const url = `${apiConfig.getApiUrl()}/api/health`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this._getCommonHeaders(),
      });
      return await this._handleApiResponse(response, '서버 상태 확인에 실패했습니다');
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 내 식재료 목록 조회
   * @returns {Promise<Object>} { success, data }
   */
  async getIngredients() {
    const url = `${apiConfig.getApiUrl()}/food/ownlist`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this._getCommonHeaders(),
      });
      const result = await this._handleApiResponse(response, '식재료 목록 조회에 실패했습니다');
      // 서버 응답이 { foodList: [...] } 형태라면 data에 foodList를 넣어줌
      if (result && result.foodList) {
        return { success: true, data: result.foodList };
      }
      // 이미 data로 감싸서 올 수도 있음
      if (result && result.data) {
        return { success: true, data: result.data };
      }
      return { success: false, error: '식재료 목록이 없습니다.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 최근(추천) 레시피 목록 조회 (임시 더미)
   * @param {number} userId
   * @returns {Promise<Object>} { success, data }
   */
  async getRecommendedRecipes(userId) {
    // 실제 서버 API가 있다면 아래를 교체
    // const url = `${apiConfig.getApiUrl()}/recipe/recent/${userId}`;
    // try {
    //   const response = await fetch(url, {
    //     method: 'GET',
    //     headers: this._getCommonHeaders(),
    //   });
    //   const result = await this._handleApiResponse(response, '레시피 목록 조회에 실패했습니다');
    //   return { success: true, data: result.data || result.recipes || [] };
    // } catch (error) {
    //   return { success: false, error: error.message };
    // }
    // 임시 더미 데이터 반환
    return this.getMockData('recipes');
  },

  /**
   * 사용자별 최근 사용 레시피 조회
   * @param {number} userId
   * @returns {Promise<Object>} { success, data }
   */
  async getRecentRecipes(userId) {
    const url = `${apiConfig.getApiUrl()}/recipe/used/${userId}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this._getCommonHeaders(),
      });
      const serverResponse = await this._handleApiResponse(response, '최근 사용 레시피 조회에 실패했습니다');

      if (serverResponse && serverResponse._devMode === true && serverResponse.success === true) {
        return serverResponse; // 개발 모드 오류 처리
      }

      // 백엔드에서 이제 recipeList에 상세 정보가 포함된 SavedRecipeInfo 객체들을 반환
      if (serverResponse && serverResponse.recipeList) {
        return { success: true, data: serverResponse.recipeList };
      } else {
        return { success: true, data: [] }; 
      }
    } catch (error) {
      console.error('[apiService] getRecentRecipes 실패:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 식재료 추가 (서버 DTO에 맞게)
   * @param {number} userId
   * @param {Object} foodData { foodList: [{ foodName, amount, unit }] }
   * @returns {Promise<Object>} 서버 응답
   */
  async addFood(userId, foodData) {
    const url = `${apiConfig.getApiUrl()}/food`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this._getCommonHeaders(),
        body: JSON.stringify(foodData)
      });
      if (response.ok) {
        return { success: true, data: await response.json() };
      } else {
        let errorMsg = '식재료 추가에 실패했습니다';
        try {
          const text = await response.text();
          if (text && text.trim().startsWith('{')) {
            const err = JSON.parse(text);
            if (err.message) errorMsg = err.message;
          }
        } catch {}
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 식재료(재고) 차감/업데이트
   * @param {number} userId
   * @param {Array} foodDataList - [{ foodId, amount, unit }]
   * @returns {Promise<Object>} 서버 응답
   */
  async updateFoodAmount(userId, foodDataList) {
    const url = `${apiConfig.getApiUrl()}/food/amount-update`;
    const body = { foodDataList };
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this._getCommonHeaders(),
        body: JSON.stringify(body)
      });
      if (response.ok) {
        return { success: true };
      } else {
        let errorMsg = '식재료 업데이트에 실패했습니다';
        try {
          const text = await response.text();
          if (text && text.trim().startsWith('{')) {
            const err = JSON.parse(text);
            if (err.message) errorMsg = err.message;
          }
        } catch {}
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 조건에 맞는 레시피 검색 API 호출
   * @param {Object} searchParams - 검색 매개변수 (foodName, calorie, fat, natrium, protien, carbohydrate 등)
   * @returns {Promise<Object>} 검색 결과 { success, data }
   */
  async searchRecipes(searchParams) {
    try {
      // startIndex, endIndex 분리해서 전달
      const { startIndex, endIndex, ...restParams } = searchParams;
      const url = `${apiConfig.getApiUrl()}/recipe`;
      const body = {
        ...restParams
      };
      // startIndex, endIndex는 쿼리스트링이 아니라 body에 포함
      if (typeof startIndex === 'number') body.startIndex = startIndex;
      if (typeof endIndex === 'number') body.endIndex = endIndex;

      console.log('[apiService] 레시피 검색 요청:', body);
      const response = await fetch(url, {
        method: 'POST',
        headers: this._getCommonHeaders(),
        body: JSON.stringify(body)
      });
      const result = await this._handleApiResponse(response, '레시피 검색에 실패했습니다');
      // 서버 응답이 recipeList 형태라면 정규화
      let recipes = [];
      if (result && result.recipeList && Array.isArray(result.recipeList)) {
        console.log('[apiService] searchRecipes - Raw recipeList from server BEFORE mapping:', JSON.stringify(result.recipeList, null, 2)); // 추가된 로그

        console.log('[apiService] searchRecipes - Received recipeList from server:', JSON.stringify(result.recipeList, null, 2)); // 서버 원본 데이터 로그

        recipes = result.recipeList.map((recipe, idx) => {
          // 각 레시피 객체와 RCP_SEQ 관련 필드 로그 추가
          console.log(`[apiService] searchRecipes - Processing recipe at index ${idx}:`, JSON.stringify(recipe, null, 2));
          console.log(`[apiService] searchRecipes - RCP_SEQ from recipe: recipe.rcpSeq=${recipe.rcpSeq}, recipe.RCP_SEQ=${recipe.RCP_SEQ}`);

          let steps = recipe.manuals || recipe.steps || recipe.cookingProcess;
          if (!steps || (Array.isArray(steps) && steps.length === 0)) {
            steps = ['조리법 정보가 없습니다.'];
          }
          // steps가 배열이면 각 항목에서 앞쪽 중복 번호(예: '1.1. ') 제거
          if (Array.isArray(steps)) {
            steps = steps.map(step =>
              typeof step === 'string'
                ? step.replace(/^\d+\.\d+\.\s*/, '').trim()
                : step
            );
          }
          const newId = recipe.rcpSeq || recipe.RCP_SEQ || idx + 1;
          const newRcpSeq = recipe.rcpSeq || recipe.RCP_SEQ;

          console.log(`[apiService] searchRecipes - Assigning to recipe: id=${newId}, rcpSeq=${newRcpSeq}`);

          return {
            id: newId, // RCP_SEQ 값을 id로 사용 (실제 필드명 확인 필요)
            rcpSeq: newRcpSeq, // RCP_SEQ 값을 명시적으로 저장 (실제 필드명 확인 필요)
            title: recipe.recipeName || recipe.name || recipe.RCP_NM, // RCP_NM 필드 추가
            ingredients: recipe.ingredient || recipe.ingredients || recipe.RCP_PARTS_DTLS, // RCP_PARTS_DTLS 필드 추가
            steps,
            // 썸네일: ATT_FILE_NO_MK > ATT_FILE_NO_MAIN만 사용
            thumbnail: recipe.attFileNoMk || recipe.attFileNoMain || recipe.ATT_FILE_NO_MK || recipe.ATT_FILE_NO_MAIN || null, // API 필드명 확인 및 중복 제거
            // 영양 정보 추가
            nutritionInfo: {
              calorie: recipe.calorie ?? null,
              carbohydrate: recipe.carbohydrate ?? null,
              protein: recipe.protein ?? null,
              fat: recipe.fat ?? null,
              natrium: recipe.natrium ?? null
            }
          };
        });
      } else if (result && result.data && Array.isArray(result.data)) {
        // result.data가 이미 정제된 형태일 경우, rcpSeq가 포함되어 있는지 확인 필요
        console.log('[apiService] searchRecipes - Received data (already refined?):', JSON.stringify(result.data, null, 2));
        recipes = result.data.map((recipe, idx) => {
          console.log(`[apiService] searchRecipes - Processing refined recipe at index ${idx}:`, JSON.stringify(recipe, null, 2));
          const newId = recipe.rcpSeq || recipe.RCP_SEQ || recipe.id || idx + 1;
          const newRcpSeq = recipe.rcpSeq || recipe.RCP_SEQ;
          console.log(`[apiService] searchRecipes - Assigning to refined recipe: id=${newId}, rcpSeq=${newRcpSeq}`);
          return {
            ...recipe,
            id: newId, // RCP_SEQ 우선
            rcpSeq: newRcpSeq, // RCP_SEQ 명시적 저장
            // nutritionInfo가 이미 객체 형태로 존재하면 유지, 아니면 공공데이터 필드에서 생성
            nutritionInfo: recipe.nutritionInfo || {
              calorie: recipe.calorie ?? null,
              carbohydrate: recipe.carbohydrate ?? null,
              protein: recipe.protein ?? null,
              fat: recipe.fat ?? null,
              natrium: recipe.natrium ?? null
            }
          };
        });
      }
      console.log('[apiService] searchRecipes - Final recipes to be returned:', JSON.stringify(recipes, null, 2)); // 최종 반환될 데이터 로그
      return { success: true, data: recipes };
    } catch (error) {
      console.error('[apiService] 레시피 검색 실패:', error);
      throw error;
    }
  },

  /**
   * 최근 사용 레시피(조회 또는 조리 완료) 저장
   * @param {number} userId - 현재는 사용되지 않지만 API 명세에 따라 유지 (실제로는 헤더의 토큰으로 사용자 식별)
   * @param {Object} recipePayload - PostUsedRecipeRequest DTO와 일치하는 전체 레시피 정보 (cooked 필드 포함)
   * @returns {Promise<Object>} 서버 응답
   */
  async addUsedRecipe(userId, recipePayload) { 
    // recipePayload는 cooked 필드를 포함해야 함
    // 예: recipePayload = { ...recipeDetails, cooked: true } 또는 { ...recipeDetails, cooked: false }
    const body = recipePayload;

    const url = `${apiConfig.getApiUrl()}/recipe/used`; 

    console.log('[apiService] addUsedRecipe 요청 본문:', JSON.stringify(body, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this._getCommonHeaders(), // userId는 헤더의 토큰으로 처리됨
        body: JSON.stringify(body)
      });
      const result = await this._handleApiResponse(response, '최근 사용 레시피 저장에 실패했습니다');
      
      if (response.ok) {
        return { success: true, data: result };
      }
      return result;
    } catch (error) {
      console.error('[apiService] 최근 사용 레시피 저장 중 오류:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 즐겨찾기 레시피 목록 조회
   * @param {number} userId
   * @returns {Promise<Object>} { success, data } // data는 UserFavoriteRecipe[] 형태가 될 것
   */
  async getFavoriteRecipes(userId) {
    const url = `${apiConfig.getApiUrl()}/recipe/favorites/${userId}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this._getCommonHeaders(),
      });
      const result = await this._handleApiResponse(response, '즐겨찾기 레시피 조회에 실패했습니다');
      // 서버 응답이 UserFavoriteRecipe[]를 직접 data 필드에 담아 반환한다고 가정
      // 또는 result 자체가 배열일 수 있음
      if (result && result.success !== false && Array.isArray(result.data)) { // result.success가 false가 아니고, result.data가 배열인 경우
        return { success: true, data: result.data };
      }
      if (result && result.success !== false && Array.isArray(result)) { // result 자체가 배열인 경우 (e.g. controller에서 직접 List 반환)
        return { success: true, data: result };
      }
      // 이전의 recipeList 같은 특정 필드명 대신, 일반적인 data 필드 또는 직접 배열 반환을 우선적으로 처리
      // 실패했거나 데이터가 없는 경우
      if (result && result.success === false) return result; // 오류 메시지가 포함된 결과 반환
      return { success: true, data: [] }; // 성공했지만 데이터가 없는 경우
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 레시피 즐겨찾기 추가
   * @param {number} userId
   * @param {Object} recipePayload - 즐겨찾기에 추가할 레시피의 전체 상세 정보 (UserFavoriteRecipe DTO와 유사)
   * @returns {Promise<Object>} 서버 응답 (성공 시 UserFavoriteRecipe 객체 포함)
   */
  async addFavoriteRecipe(userId, recipePayload) {
    // userId는 쿼리 파라미터로, recipePayload는 요청 본문으로 전달
    // 서버 RecipeController의 @PostMapping("/favorite") 엔드포인트는 @RequestParam String userId, @RequestBody PostFavoriteRecipeRequest request
    // PostFavoriteRecipeRequest는 UserFavoriteRecipe를 생성하는데 필요한 필드를 가짐
    const url = `${apiConfig.getApiUrl()}/recipe/favorite?userId=${userId}`;
    console.log('[apiService] addFavoriteRecipe 요청:', url, JSON.stringify(recipePayload, null, 2));
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this._getCommonHeaders(),
        body: JSON.stringify(recipePayload)
      });
      const result = await this._handleApiResponse(response, '즐겨찾기 추가에 실패했습니다');
      
      if (response.ok && result) { // result가 null/undefined가 아닌지 확인
        // 서버는 생성된 UserFavoriteRecipe 객체를 반환
        return { success: true, data: result }; // result 자체가 UserFavoriteRecipe 객체일 것으로 기대
      }
      // 실패 시 result에 오류 메시지 포함 (handleApiResponse에서 처리)
      // 또는 result가 { success: false, error: ... } 형태일 수 있음
      return result && typeof result === 'object' && result.hasOwnProperty('success') ? result : { success: false, error: result?.message || '즐겨찾기 추가에 실패했습니다.' };
    } catch (error) {
      console.error('[apiService] 즐겨찾기 추가 중 오류:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 레시피 즐겨찾기 해제
   * @param {number} userId - 사용자 ID
   * @param {number} favoriteRecipeId - UserFavoriteRecipe의 PK (id)
   * @returns {Promise<Object>} 서버 응답
   */
  async removeFavoriteRecipe(userId, favoriteRecipeId) {
    // 서버 RecipeController의 @DeleteMapping("/favorite") 엔드포인트는 
    // @RequestParam Long userId, @RequestParam Long recipeId (이 recipeId가 UserFavoriteRecipe의 PK)
    const url = `${apiConfig.getApiUrl()}/recipe/favorite?userId=${userId}&recipeId=${favoriteRecipeId}`;
    console.log('[apiService] removeFavoriteRecipe 요청:', url);
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this._getCommonHeaders(),
      });
      // DELETE 요청은 보통 성공 시 200 OK 또는 204 No Content를 반환하며, 본문이 없을 수 있음
      if (response.ok) {
        return { success: true };
      } else {
        const result = await this._handleApiResponse(response, '즐겨찾기 해제에 실패했습니다');
        return result && typeof result === 'object' && result.hasOwnProperty('success') ? result : { success: false, error: result?.message || '즐겨찾기 해제에 실패했습니다.'};
      }
    } catch (error) {
      console.error('[apiService] 즐겨찾기 해제 중 오류:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 개발/테스트용 더미 데이터 반환
   * @param {string} type 'ingredients' | 'recipes'
   * @returns {Object}
   */
  getMockData(type) {
    if (type === 'ingredients') {
      return {
        success: true,
        data: [
          { name: '달걀', quantity: 6 },
          { name: '우유', quantity: 1 },
          { name: '양파', quantity: 2 },
          { name: '감자', quantity: 3 },
          { name: '당근', quantity: 1 },
        ]
      };
    }
    if (type === 'recipes') {
      return {
        success: true,
        data: [
          { id: 1, name: '계란찜', status: 'completed' },
          { id: 2, name: '감자볶음', status: 'completed' },
          { id: 3, name: '김치찌개', status: 'in-progress' },
          { id: 4, name: '된장국', status: 'completed' },
        ]
      };
    }
    return { success: false, data: [] };
  },

  /**
   * 조리 완료된 음식 삭제
   * @param {string | number} cookedDishId - 삭제할 조리 완료 음식 ID
   * @returns {Promise<Object>}
   */
  async deleteCookedDish(cookedDishId) {
    const url = `${apiConfig.getApiUrl()}/cooked-dishes/${cookedDishId}`;
    console.log(`[apiService] 조리 완료 음식 삭제 요청 URL: ${url}`);
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this._getCommonHeaders(),
      });
      const result = await this._handleApiResponse(response, '조리 완료 음식 삭제에 실패했습니다');

      if (typeof result === 'object' && result._devMode === true && result._originalError) {
        console.warn('[apiService] deleteCookedDish: Handled dev mode error:', result._originalError);
        return { success: false, error: result._originalError };
      }
      if (typeof result === 'object' && result.success === false) {
        return result;
      }
      
      return { success: true, data: result };
    } catch (error) {
      console.error(`[apiService] deleteCookedDish (${cookedDishId}) 실패:`, error);
      return { success: false, error: error.message || '조리 완료 음식 삭제 중 오류 발생' };
    }
  },

  /**
   * Gemini API 호출 함수 (대체 식재료 추천)
   * @param {string} menuName - 현재 레시피 이름
   * @param {string} replaceFood - 대체할 식재료 이름
   * @returns {Promise<Object>} { success, data: string[] | undefined, error: string | undefined }
   */
  async getAlternativeFood(menuName, replaceFood) {
    let baseUrl = apiConfig.getApiUrl();
    // baseUrl이 이미 /로 끝나는 경우 중복 슬래시 방지
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    // 경로와 쿼리 파라미터를 수동으로 조합
    const path = '/api/external/gemini/alternatives';
    const queryParams = `?menuName=${encodeURIComponent(menuName)}&replaceFood=${encodeURIComponent(replaceFood)}`;
    const fullUrl = `${baseUrl}${path}${queryParams}`;

    console.log(`[apiService] 대체 식재료 요청 URL: ${fullUrl}`);

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: this._getCommonHeaders(),
      });
      
      const apiResult = await this._handleApiResponse(response, '대체 식재료 조회에 실패했습니다');

      if (typeof apiResult === 'object' && apiResult !== null && apiResult._devMode === true && apiResult._originalError) {
          console.warn('[apiService] getAlternativeFood: Handled dev mode error:', apiResult._originalError);
          return { success: false, error: apiResult._originalError, data: [] };
      }
      if (typeof apiResult === 'object' && apiResult !== null && apiResult.success === false) {
          // _handleApiResponse가 이미 { success: false, error: ..., data?: ... } 형태로 반환하는 경우
          return { ...apiResult, data: apiResult.data || [] };
      }

      // 수정: apiResult가 배열인 경우 (백엔드에서 List<String>을 반환하고 JSON으로 파싱된 경우)
      if (Array.isArray(apiResult)) {
        const alternatives = apiResult
          .map(s => String(s).trim()) // 각 요소를 문자열로 변환하고 공백 제거
          .filter(s => s.length > 0);  // 빈 문자열 제외
        return { success: true, data: alternatives };
      }
      
      // 기존: apiResult가 문자열인 경우 (예: 쉼표로 구분된 문자열)
      if (typeof apiResult === 'string') {
        if (apiResult.trim() === '') {
          return { success: true, data: [] }; // 빈 문자열은 대체 식재료 없음
        }
        const alternatives = apiResult.split(',').map(s => s.trim()).filter(s => s.length > 0);
        return { success: true, data: alternatives };
      }
      
      console.error('[apiService] getAlternativeFood: Unexpected response format from _handleApiResponse for successful call:', apiResult);
      return { success: false, error: '대체 식재료 응답 형식이 올바르지 않습니다.', data: [] };

    } catch (error) {
      console.error('[apiService] getAlternativeFood API 호출 실패:', error);
      return { success: false, error: error.message || '대체 식재료 조회 중 오류 발생', data: [] };
    }
  }
  // ...추가 API 함수(식재료 등)는 필요시 이식...
};

export default apiService;