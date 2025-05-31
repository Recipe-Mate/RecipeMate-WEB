import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '@env';

<<<<<<< HEAD
const RecipeCompletedList = () => {
=======
const UsedRecipes = () => {
>>>>>>> app_merge
  const [recipes, setRecipes] = useState([]);

  const fetchUsedRecipes = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');

      const response = await fetch(`${SERVER_URL}/recipe/used`, {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`서버 요청 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log('서버에서 받은 데이터:', data);

      // recipeList 배열이 있으면 상태로 저장
      if (data.recipeList) {
        setRecipes(data.recipeList);
      }
    } catch (error) {
      console.error('레시피 사용 내역 가져오기 실패:', error);
    }
  };

  useEffect(() => {
    fetchUsedRecipes();
  }, []);

  return (
<<<<<<< HEAD
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.box}>
        {recipes.map((recipe) => (
          <View key={recipe.id} style={styles.recipe_view}>
            <Image source={{ uri: recipe.recipeImage }} style={styles.recipe_photo} />
            <Text style={styles.recipe_text}>{recipe.recipeName}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
=======
    <ScrollView contentContainerStyle={styles.box}>
      {recipes.map((recipe) => (
        <View key={recipe.id} style={styles.recipe_view}>
          <Image source={{ uri: recipe.recipeImage }} style={styles.recipe_photo} />
          <Text style={styles.recipe_text}>{recipe.recipeName}</Text>
        </View>
      ))}
    </ScrollView>
>>>>>>> app_merge
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: '#EEF1FA',
<<<<<<< HEAD
  },
  recipe_photo: {
=======
    flex: 1
  },
 recipe_photo: {
>>>>>>> app_merge
    width: 80,
    height: 80,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: '#2D336B',
  },
  recipe_view: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    padding: 10,
    paddingRight: 20,
    marginRight: 15,
    marginBottom: 15,
    borderRadius: 25,
    alignItems: 'center',
<<<<<<< HEAD
    width: 340,
=======
    width: 340, 
>>>>>>> app_merge
    elevation: 5,
  },
  recipe_text: {
    paddingLeft: 18,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D336B',
    flexShrink: 1,
  },
});

<<<<<<< HEAD
export default RecipeCompletedList;
=======
export default UsedRecipes;
>>>>>>> app_merge
