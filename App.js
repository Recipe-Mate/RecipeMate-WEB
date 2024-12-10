import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';

import Main from './screens/Main';
import RecipeSearch from './screens/RecipeSearch';
import RecipeDetail from './screens/RecipeDetail';
import UserProfile from './screens/User_Profile';
import Setting from './screens/Settings';

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
            } else if (route.name === 'Profile') {
              iconName = 'person-outline';
            } else if (route.name === 'Setting') {
              iconName = 'settings-outline';
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
        <Tab.Screen name="Profile" component={UserProfile} />
        <Tab.Screen name="Setting" component={Setting} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
