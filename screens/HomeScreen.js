import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// 임시 데이터 - 실제로는 API에서 가져올 것
const FEATURED_RECIPES = [
  { id: 1, title: '김치찌개', image: 'https://example.com/kimchi-stew.jpg' },
  { id: 2, title: '비빔밥', image: 'https://example.com/bibimbap.jpg' },
  { id: 3, title: '불고기', image: 'https://example.com/bulgogi.jpg' },
];

const RECENT_RECIPES = [
  { id: 4, title: '순두부찌개', image: 'https://example.com/sundubu.jpg' },
  { id: 5, title: '잡채', image: 'https://example.com/japchae.jpg' },
  { id: 6, title: '김밥', image: 'https://example.com/kimbap.jpg' },
];

const HomeScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const renderRecipeItem = (recipe, index) => (
    <TouchableOpacity
      key={index}
      style={styles.recipeItem}
      onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
    >
      <View style={styles.recipeCard}>
        <View style={styles.imageContainer}>
          <Text style={[styles.recipeTitle, { color: theme.text }]}>{recipe.title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>추천 레시피</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <Text style={[styles.seeAll, { color: theme.primary }]}>더 보기</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredContainer}>
        {FEATURED_RECIPES.map(renderRecipeItem)}
      </ScrollView>

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 20 }]}>최근 본 레시피</Text>
      <View style={styles.recentContainer}>
        {RECENT_RECIPES.map(renderRecipeItem)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAll: {
    fontSize: 16,
  },
  featuredContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  recentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recipeItem: {
    width: 150,
    marginRight: 10,
    marginBottom: 10,
  },
  recipeCard: {
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
    height: 100,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeTitle: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HomeScreen;
