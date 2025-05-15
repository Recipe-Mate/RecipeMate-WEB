import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';

const RecipeCompletedList = ({ navigation }) => {
  const [recipes, setRecipes] = React.useState([]);
  const { user } = require('../src/context/AuthContext').useAuth();
  const [loading, setLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchData = async () => {
        setLoading(true);
        try {
          if (user && user.id) {
            const result = await require('../src/services/api.service').default.getRecentRecipes(user.id);
            if (isActive && result && result.success && result.data) {
              setRecipes(result.data);
            } else if (isActive) {
              setRecipes([]);
            }
          } else if (isActive) {
            setRecipes([]);
          }
        } catch (e) {
          if (isActive) setRecipes([]);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchData();
      return () => { isActive = false; };
    }, [user])
  );

  const handleRecipePress = (recipeId) => {
    navigation.navigate('RecipeDetail', { recipeId });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.emptyText}>불러오는 중...</Text>
      ) : recipes.length === 0 ? (
        <Text style={styles.emptyText}>최근에 요리 완료한 레시피가 없습니다.</Text>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id?.toString() || item.name}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => handleRecipePress(item.id)}>
              <Icon name="restaurant-outline" size={28} color="#4CAF50" style={{ marginRight: 12 }} />
              <Text style={styles.itemText}>{item.name}</Text>
            </TouchableOpacity>
          )}
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
  itemText: {
    fontSize: 17,
    color: '#333',
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default RecipeCompletedList;