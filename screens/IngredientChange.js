import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const IngredientChange = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>재료 변동 사항</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.contentText}>이 화면에서는 레시피의 재료 변동 사항을 확인할 수 있습니다.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 20,
    backgroundColor: '#4CAF50',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    padding: 20,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
  }
});

export default IngredientChange;