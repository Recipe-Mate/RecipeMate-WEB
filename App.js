import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

import Main from './screens/Main';
import Profile from './screens/Profile';

import Receipt from './screens/Receipt';
import RecipeSearch from './screens/RecipeSearch';
import RecipeDetail from './screens/RecipeDetail';
import RecipeResult from './screens/RecipeResult';
import IngredientChange from './screens/IngredientChnage';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const RecipeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="RecipeSearch"
      component={RecipeSearch}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="RecipeDetail"
      component={RecipeDetail}
      options={{ title: '레시피 상세', headerShown: true }}
    />
    <Stack.Screen
      name="RecipeResult"
      component={RecipeResult}
      options={{ title: '검색결과', headerShown: true }}
    />
    <Stack.Screen
      name="IngredientChange"
      component={IngredientChange}
      options={{ title: '재료 변동 사항', headerShown: true }}
    />
  </Stack.Navigator>
);

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Profile"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = 'home-outline';
            } else if (route.name === 'Recipe') {
              iconName = 'book-outline';
            } else if (route.name === 'Receipt') {
              iconName = 'camera-outline';
            } else if (route.name === 'Profile') {
              iconName = 'person-outline';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#f4a261',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: { backgroundColor: '#f4f4f4', height: 60 },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={Main} />
        <Tab.Screen name="Recipe" component={RecipeStack} />
        <Tab.Screen name="Receipt" component={Receipt} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
