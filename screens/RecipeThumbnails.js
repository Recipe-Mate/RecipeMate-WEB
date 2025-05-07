import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Modal, Pressable } from 'react-native';

// 레시피 썸네일 리스트 화면
const RecipeThumbnails = ({ route, navigation }) => {
  // route.params에서 레시피 배열 받기
  const { recipes = [] } = route.params || {};
  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState('');

  // 썸네일 클릭 시 상세로 이동
  const handlePress = (recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  const handleTextPress = (recipe) => {
    setModalText(JSON.stringify(recipe, null, 2));
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>레시피 썸네일 목록</Text>
      {recipes.length === 0 ? (
        <Text style={styles.emptyText}>표시할 레시피가 없습니다.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
          {recipes.map((recipe, idx) => (
            <TouchableOpacity key={recipe.id || idx} onPress={() => handlePress(recipe)} style={styles.itemContainer}>
              <Image
                source={recipe.thumbnail && recipe.thumbnail.startsWith('http')
                  ? { uri: recipe.thumbnail }
                  : require('../assets/soy_bean_paste_soup.png') // 기본 이미지
                }
                style={styles.thumbnail}
              />
              <Text style={styles.recipeName} numberOfLines={1}>{recipe.recipeName || recipe.title || '이름 없음'}</Text>
              <TouchableOpacity onPress={() => handleTextPress(recipe)}>
                <Text style={styles.recipeDesc} numberOfLines={6}>
                  {JSON.stringify(recipe, null, 2)}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalText} selectable={true}>{modalText}</Text>
            </ScrollView>
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flexGrow: 0,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 16,
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  recipeName: {
    width: 120,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
  itemContainer: {
    width: 130,
    alignItems: 'center',
    marginRight: 16,
  },
  recipeDesc: {
    width: 120,
    fontSize: 10,
    color: '#666',
    textAlign: 'left',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#222',
    textAlign: 'left',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecipeThumbnails;
