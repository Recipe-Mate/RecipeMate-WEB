import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const SearchScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = () => {
    if (!query.trim()) return;
    
    setLoading(true);
    
    // 여기에서 API 호출을 수행할 수 있습니다
    // 현재는 임시 데이터를 사용합니다
    setTimeout(() => {
      const mockResults = [
        { id: 1, title: '김치찌개', time: '30분' },
        { id: 2, title: '된장찌개', time: '25분' },
        { id: 3, title: '불고기', time: '40분' },
      ].filter(item => item.title.includes(query));
      
      setResults(mockResults);
      setLoading(false);
    }, 1000);
  };
  
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { color: theme.text, borderColor: theme.text }]}
          placeholder="레시피 검색..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: theme.primary }]}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.resultItem, { borderBottomColor: theme.text + '20' }]}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
            >
              <Text style={[styles.resultTitle, { color: theme.text }]}>{item.title}</Text>
              <Text style={[styles.resultTime, { color: theme.text + '80' }]}>{item.time}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.text + '80' }]}>
              {query ? '검색 결과가 없습니다.' : '레시피를 검색해보세요.'}
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 40,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultTime: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});

export default SearchScreen;
