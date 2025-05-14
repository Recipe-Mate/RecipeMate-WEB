import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // 아이콘 사용 시
import { useFocusEffect } from '@react-navigation/native';
import apiService from '../src/services/api.service';
import { useAuth } from '../src/context/AuthContext';

const CookedRecipesScreen = ({ navigation }) => {
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
            const result = await apiService.getRecentRecipes(user.id);
            if (isActive && result && result.success && result.data) {
              setRecipes(result.data);
            } else if (isActive) {
              setRecipes([]);
              if (result && !result.success) {
                console.warn('CookedRecipesScreen: Failed to fetch recent recipes - ', result.error);
              }
            }
          } else if (isActive) {
            setRecipes([]);
          }
        } catch (e) {
          if (isActive) setRecipes([]);
          console.error('CookedRecipesScreen: Error fetching recent recipes - ', e);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchData();
      return () => { isActive = false; };
    }, [user])
  );

  const handleRecipePress = (recipe) => {
    // recipe 객체는 이제 getRecentRecipes로부터 받은 상세 정보를 포함한 SavedRecipeInfo 객체입니다.
    // SavedRecipeInfo의 기본 키인 id를 recipeId로 사용하고, 전체 객체를 recipeData로 전달합니다.
    const recipeId = recipe.id; // SavedRecipeInfo의 PK (Long id)
    
    if (recipeId) {
      console.log("[CookedRecipesScreen] Navigating to CookedRecipeDetailScreen with:", JSON.stringify(recipe, null, 2));
      navigation.navigate('RecipeStack', { 
        screen: 'CookedRecipeDetailScreen', // CookedRecipeDetailScreen으로 변경
        params: { 
          recipeId: recipeId, // SavedRecipeInfo의 PK
          recipeData: recipe   // SavedRecipeInfo 전체 객체 전달
        }
      });
    } else {
      console.warn("CookedRecipesScreen: Recipe ID (SavedRecipeInfo.id) is missing", recipe);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleRecipePress(item)}>
      {item.recipeImage ? (
        <Image source={{ uri: item.recipeImage }} style={styles.recipeImage} />
      ) : (
        <View style={styles.recipeImagePlaceholder}>
          <Icon name="restaurant-outline" size={24} color="#ccc" />
        </View>
      )}
      <View style={styles.recipeInfo}>
        <Text style={styles.itemText}>{item.recipeName || '이름 없는 레시피'}</Text>
        {item.lastUsedAt && (
          <Text style={styles.dateText}>
            최근 사용: {new Date(item.lastUsedAt).toLocaleDateString()} {new Date(item.lastUsedAt).toLocaleTimeString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>최근 본 레시피</Text>
      {loading ? (
        <Text style={styles.emptyText}>불러오는 중...</Text>
      ) : recipes.length === 0 ? (
        <Text style={styles.emptyText}>최근 본 레시피가 없습니다.</Text>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item, index) => (item.id?.toString() || `cooked-${index}`)}
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
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  recipeImage: {
    width: 60, // 이미지 크기 조정
    height: 60, // 이미지 크기 조정
    borderRadius: 8,
    marginRight: 15,
  },
  recipeImagePlaceholder: {
    width: 60, // 이미지 크기 조정
    height: 60, // 이미지 크기 조정
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    flex: 1,
  },
  itemText: {
    fontSize: 17,
    fontWeight: '500', // 텍스트 굵기 추가
    color: '#333',
  },
  dateText: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default CookedRecipesScreen;