// import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Main from "./screens/Main";
import RecipeSearch from './screens/RecipeSearch';
import RecipeDetail from './screens/RecipeDetail';
import Bill from "./screens/Bill";
import Profile from "./screens/Profile";
import Badge from "./screens/Badge";


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

const ProfileStack = () => (
  <Stack.Navigator initialRouteName='Profile'>
    <Stack.Screen
      name="Profile"
      component={Profile}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Badge"
      component={Badge}
      options={{ 
        headerStyle: {
          backgroundColor: '#333f50', // header color
        },
        headerTintColor: '#ffffff', // header text color
        headerBackTitleStyle: {
          fontSize: 16,
        },
        title: '획득한 배지', headerShown: true, headerBackTitle: '뒤로가기' }}
    />
  </Stack.Navigator>
);




export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator 
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#333f50', 
            height: 80,
          },
          tabBarItemStyle: { paddingTop: 5, },
          tabBarActiveTintColor: 'white', 
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Main"
          component={Main}
          options={{
            title: '홈',
            tabBarIcon: ({color, size}) => (
              <Icon name='home' color={color} size={25}/>
            )
          }}
        />
        <Tab.Screen 
          name="Recipe"
          component={RecipeStack}
          options={{
            title: '레시피',
            tabBarIcon: ({color, size}) => (
              <Icon name='restaurant' color={color} size={25} />
            )
          }}
        />
        <Tab.Screen
          name="Bill"
          component={Bill}
          options={{
            title: '영수증',
            tabBarIcon: ({color, size}) => (
              <Icon name='receipt' color={color} size={25} />
            )
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStack}
          options={{
            title: '프로필',
            tabBarIcon: ({color, size}) => (
              <Icon name='person' color={color} size={25} />
            )
          }}
        />
      </Tab.Navigator>
      <StatusBar barStyle="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 70,
    backgroundColor: '#ffffff',
  },
  box: {
    flex: 10,
    backgroundColor: '#ffffff',
  },
  title: {
    marginLeft: 30,
    marginBottom: 30,
    fontSize: 30,
    fontWeight: 900,
  },
  ingredient: {
    marginLeft: 30,
    marginBottom: 15,
    fontSize: 20,
  },
});