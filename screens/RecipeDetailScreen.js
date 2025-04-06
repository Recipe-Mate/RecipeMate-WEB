import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

// 임시 레시피 데이터 - 실제로는 API에서 가져올 것
const RECIPE_DETAILS = {
  1: {
    id: 1,
    title: '김치찌개',
    time: '30분',
    servings: '2인분',
    difficulty: '쉬움',
    ingredients: [
      '김치 300g',
      '돼지고기 100g',
      '두부 1/2모',
      '대파 1대',
      '고춧가루 1큰술',
      '다진 마늘 1큰술',
      '식용유 1큰술',
    ],
    instructions: [
      '김치를 적당한 크기로 썬다.',
      '돼지고기는 먹기 좋은 크기로 썬다.',
      '두부는 한입 크기로 썬다.',
      '냄비에 식용유를 두르고 돼지고기를 볶는다.',
      '고기가 익으면 김치를 넣고 같이 볶는다.',
      '물을 넣고 끓인 후, 두부와 대파를 넣는다.',
      '간을 맞추고 5분간 더 끓인다.',
    ],
  },
  // 다른 레시피 데이터...
};

const RecipeDetailScreen = ({ route }) => {
  const { recipeId } = route.params;
  const { theme } = useTheme();
  const { t } = useLanguage();
  
  const recipe = RECIPE_DETAILS[recipeId];
  
  if (!recipe) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>레시피를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>{recipe.title}</Text>
      
      <View style={styles.infoContainer}>
        <InfoItem label="시간" value={recipe.time} theme={theme} />
        <InfoItem label="양" value={recipe.servings} theme={theme} />
        <InfoItem label="난이도" value={recipe.difficulty} theme={theme} />
      </View>
      
      <Text style={[styles.sectionTitle, { color: theme.primary }]}>{t.ingredients}</Text>
      <View style={styles.listContainer}>
        {recipe.ingredients.map((item, index) => (
          <Text key={index} style={[styles.listItem, { color: theme.text }]}>
            • {item}
          </Text>
        ))}
      </View>
      
      <Text style={[styles.sectionTitle, { color: theme.primary }]}>{t.instructions}</Text>
      <View style={styles.listContainer}>
        {recipe.instructions.map((item, index) => (
          <Text key={index} style={[styles.stepItem, { color: theme.text }]}>
            {index + 1}. {item}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const InfoItem = ({ label, value, theme }) => (
  <View style={styles.infoItem}>
    <Text style={[styles.infoLabel, { color: theme.text }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: theme.accent }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 10,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  listContainer: {
    marginBottom: 20,
  },
  listItem: {
    fontSize: 16,
    marginBottom: 6,
  },
  stepItem: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});

export default RecipeDetailScreen;
