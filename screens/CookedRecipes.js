import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ScrollView } from 'react-native-gesture-handler';


const CookedRecipes = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#777" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="검색"
          placeholderTextColor="#7886C7"
        />
      </View>
      <ScrollView>
        <View style={styles.box}>
          <View style={styles.recipe_view}>
            <Image source={require('../assets/pancake.png')} style={styles.recipe_photo}></Image>
            <Text style={styles.recipe_text}>팬케이크</Text>
          </View>
          <View style={styles.recipe_view}>
            <Image source={require('../assets/kimchi_stew.png')} style={styles.recipe_photo}></Image>
            <Text style={styles.recipe_text}>김치찌개</Text>
          </View>
          <View style={styles.recipe_view}>
            <Image source={require('../assets/chicken_porridge.png')} style={styles.recipe_photo}></Image>
            <Text style={styles.recipe_text}>닭죽</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: '#7886C7',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    margin: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  icon: {
    marginRight: 8,
    color: '#7886C7'
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 18,
  },
  safeArea: {
    backgroundColor: "#EEF1FA",
    flex: 1,
  },
  box: {
    flex: 11,
    backgroundColor: '#EEF1FA',
  },
  recipe_photo: {
    width: 80,
    height: 80,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: '#2D336B',
  },
  recipe_view: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    padding: 12,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipe_text: {
    paddingLeft: 18,
    fontSize: 23,
    fontWeight: 'bold',
    color: '#2D336B',
  },
});

export default CookedRecipes;
