// 사용자 식재료 합산 리스트를 전역적으로 저장/조회하는 모듈
let mergedUserIngredients = [];

export function setMergedUserIngredients(list) {
  mergedUserIngredients = Array.isArray(list) ? list : [];
}

export function getMergedUserIngredients() {
  return mergedUserIngredients;
}
