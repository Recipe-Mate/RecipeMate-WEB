import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native'; // Alert 추가
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../src/services/api.service'; // 경로 수정
import { useAuth } from '../src/context/AuthContext'; // 경로 수정

const FavoriteRecipesScreen = ({ navigation }) => {
  const [recipes, setRecipes] = React.useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchData = async () => {
        setLoading(true);
        try {
          if (user && user.id) {
            const result = await apiService.getFavoriteRecipes(user.id);
            if (isActive && result && result.success && Array.isArray(result.data)) {
              // UserFavoriteRecipe 객체 목록을 그대로 사용
              // UserFavoriteRecipe에는 externalRecipeId, recipeName, attFileNoMk, favoritedAt 등이 있음
              setRecipes(result.data);
            } else if (isActive) {
              setRecipes([]);
              if (result && !result.success) {
                console.warn('FavoriteRecipesScreen: Failed to fetch recipes - ', result.error);
              }
            }
          } else if (isActive) {
            setRecipes([]);
          }
        } catch (e) {
          if (isActive) setRecipes([]);
          console.error('FavoriteRecipesScreen: Error fetching recipes - ', e);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchData();
      return () => { isActive = false; };
    }, [user])
  );

  const handleRecipePress = (recipe) => {
    // UserFavoriteRecipe 객체는 RecipeDetail에 필요한 모든 정보를 가지고 있을 수 있음
    // 또는 externalRecipeId를 사용하여 RecipeDetail에서 다시 로드할 수도 있음
    // 현재는 UserFavoriteRecipe 객체 전체를 recipe라는 이름으로 전달
    // RecipeDetail은 recipe.rcpSeq 또는 recipe.id (externalRecipeId)를 사용하고,
    // 나머지 필드(recipeName, ingredients, cookingProcess, attFileNoMk 등)도 UserFavoriteRecipe에서 가져옴
    // UserFavoriteRecipe의 필드명을 RecipeDetail에서 사용하는 필드명과 일치시키거나,
    // RecipeDetail에서 UserFavoriteRecipe의 필드명을 사용하도록 수정 필요.
    // 예: recipe.recipeName, recipe.attFileNoMk, recipe.ingredients (UserFavoriteRecipe.ingredient),
    // recipe.steps (UserFavoriteRecipe.cookingProcess), recipe.rcpSeq (UserFavoriteRecipe.externalRecipeId)
    
    // UserFavoriteRecipe 객체를 RecipeDetail이 기대하는 형태로 변환
    const recipeDataForDetail = {
        id: recipe.externalRecipeId, // RecipeDetail은 API 고유 ID를 id로 기대할 수 있음
        rcpSeq: recipe.externalRecipeId, // rcpSeq도 전달
        recipeName: recipe.recipeName,
        title: recipe.recipeName, // title도 recipeName으로
        image: recipe.attFileNoMk, // 썸네일 이미지
        ATT_FILE_NO_MK: recipe.attFileNoMk, // 공공데이터 필드명도 유지
        ingredients: recipe.ingredient, // UserFavoriteRecipe.ingredient -> RecipeDetail.ingredients
        steps: recipe.cookingProcess,     // UserFavoriteRecipe.cookingProcess -> RecipeDetail.steps
        // 영양 정보는 UserFavoriteRecipe에 저장된 값을 사용
        nutritionInfo: {
            calorie: recipe.calorie,
            carbohydrate: recipe.carbohydrate,
            protein: recipe.protein,
            fat: recipe.fat,
            natrium: recipe.natrium,
        },
        // UserFavoriteRecipe의 PK도 전달하여 RecipeDetail에서 즐겨찾기 상태를 정확히 알 수 있도록 함
        userFavoriteRecipeId: recipe.id 
    };

    console.log('[FavoriteRecipesScreen] Navigating to RecipeDetail with:', JSON.stringify(recipeDataForDetail, null, 2));
    navigation.navigate('RecipeDetail', { recipe: recipeDataForDetail });
  };

  const handleDeleteFavorite = async (favoriteRecipeIdToDelete) => { // 매개변수명을 명확히 함
    if (!user || !user.id || !favoriteRecipeIdToDelete) {
      Alert.alert("오류", "사용자 정보 또는 즐겨찾기 레시피 ID가 없어 삭제할 수 없습니다.");
      return;
    }

    Alert.alert(
      "즐겨찾기 삭제",
      "정말로 이 레시피를 즐겨찾기에서 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            try {
              // apiService.removeFavoriteRecipe는 userId와 favoriteRecipeId (UserFavoriteRecipe의 PK)를 받음
              const result = await apiService.removeFavoriteRecipe(user.id, favoriteRecipeIdToDelete);
              if (result && result.success) {
                // UserFavoriteRecipe의 PK (id)를 기준으로 목록에서 제거
                setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== favoriteRecipeIdToDelete));
                Alert.alert("삭제 완료", "즐겨찾기에서 삭제되었습니다.");
              } else {
                Alert.alert("삭제 실패", result.message || "즐겨찾기 삭제에 실패했습니다.");
              }
            } catch (error) {
              console.error('FavoriteRecipesScreen: Error deleting favorite - ', error);
              Alert.alert("오류", "즐겨찾기 삭제 중 오류가 발생했습니다.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    // item은 UserFavoriteRecipe 객체
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleRecipePress(item)}>
      <View style={styles.imageContainer}>
        {/* UserFavoriteRecipe의 썸네일 필드명(attFileNoMk) 사용 */}
        {item.attFileNoMk ? (
          <Image source={{ uri: item.attFileNoMk }} style={styles.recipeImage} />
        ) : (
          <View style={styles.recipeImagePlaceholder}>
            <Icon name="image-outline" size={30} color="#ccc" />
          </View>
        )}
      </View>
      <View style={styles.recipeInfo}>
        {/* UserFavoriteRecipe의 레시피 이름 필드명(recipeName) 사용 */}
        <Text style={styles.itemText} numberOfLines={1}>{item.recipeName || '이름 없는 레시피'}</Text>
        {/* UserFavoriteRecipe의 즐겨찾기 시간 필드명(favoritedAt) 사용 */}
        {item.favoritedAt && (
          <Text style={styles.dateText}>
            즐겨찾기: {new Date(item.favoritedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      {/* 삭제 시 UserFavoriteRecipe의 PK (id) 전달 */}
      <TouchableOpacity onPress={() => handleDeleteFavorite(item.id)} style={styles.deleteButton}>
        <Icon name="trash-outline" size={24} color="#FF6347" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>즐겨찾는 레시피</Text>
      {loading ? (
        <Text style={styles.emptyText}>불러오는 중...</Text>
      ) : recipes.length === 0 ? (
        <Text style={styles.emptyText}>즐겨찾는 레시피가 없습니다.</Text>
      ) : (
        <FlatList
          data={recipes}
          // keyExtractor는 UserFavoriteRecipe의 PK (id)를 사용
          keyExtractor={(item, index) => (item.id?.toString() || `favorite-${index}`)}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#2c6e91',
    textAlign: 'center', // 제목 중앙 정렬
  },
  itemContainer: { // item -> itemContainer로 변경하고 스타일 수정
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  imageContainer: { // 이미지 컨테이너 추가
    marginRight: 15,
  },
  recipeImage: {
    width: 70, // 이미지 크기 조정
    height: 70,
    borderRadius: 8,
  },
  recipeImagePlaceholder: {
    width: 70, // 이미지 크기 조정
    height: 70,
    borderRadius: 8,
    backgroundColor: '#e0e0e0', // 플레이스홀더 배경색 변경
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    flex: 1,
    justifyContent: 'center', // 텍스트 수직 중앙 정렬
  },
  itemText: {
    fontSize: 17, // 폰트 크기 조정
    fontWeight: '600', // 폰트 두께 변경
    color: '#333',
    marginBottom: 5, // 제목과 날짜 사이 간격
  },
  dateText: {
    fontSize: 13,
    color: '#777',
  },
  deleteButton: { // 삭제 버튼 스타일 추가
    padding: 8,
    marginLeft: 10,
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default FavoriteRecipesScreen;