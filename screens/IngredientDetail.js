import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const IngredientDetail = ({ route }) => {
  const { ingredient } = route.params;

  // 가상의 영양소 및 양 데이터
  const ingredientData = {
    대파: { amount: '200g', nutrients: '비타민 C, 칼슘' },
    돼지고기: { amount: '500g', nutrients: '단백질, 지방' },
    소고기: { amount: '400g', nutrients: '단백질, 철분' },
    닭: { amount: '1kg', nutrients: '단백질, 나이아신' },
    브로콜리: { amount: '300g', nutrients: '비타민 K, 섬유질' },
    사과: { amount: '5개', nutrients: '비타민 C, 식이섬유' },
  };

  const data = ingredientData[ingredient] || { amount: '정보 없음', nutrients: '정보 없음' };

  return (
    <View style={styles.container}>
      <Icon name="info" size={50} color="#82B5E1" />
      <Text style={styles.title}>{ingredient} 상세 정보</Text>
      <Text style={styles.info}>남은 양: {data.amount}</Text>
      <Text style={styles.info}>주요 영양소: {data.nutrients}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f8f8' },
  title: { fontSize: 22, fontWeight: 'bold', marginVertical: 10 },
  info: { fontSize: 18, color: '#555', marginVertical: 5 },
});

export default IngredientDetail;