import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from "@expo/vector-icons";
import Main from "./Main";
import RecipeSearch from './RecipeSearch';
import RecipeDetail from './RecipeDetail';
import RecipeResult from './RecipeResult';
import IngredientChange from './IngredientChange';
import Bill from "./Receipt_x";
import Profile from "./Profile";
import Badge from "./Badge";
import AddIngredient from './AddIngredient';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainStack = () => (
    <Stack.Navigator>
        <Stack.Screen
            name="Main"
            component={Main}
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="AddIngredient"
            component={AddIngredient}
            options={{
                headerStyle: {
                    backgroundColor: '#2D336B', // header color
                    height: 90,
                },
                headerTintColor: '#ffffff', // header text color
                headerBackTitleStyle: {
                    fontSize: 16,
                },
                headerTitleStyle: {
                    fontSize: 20, // 🔥 여기서 글자 크기 변경!
                    fontWeight: "600",
                  },
                title: '식재료 추가하기', 
                headerShown: true, 
                headerBackTitle: '뒤로'
            }}
        />
    </Stack.Navigator>
);

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
                title: '획득한 배지', 
                headerShown: true, 
                headerBackTitle: '뒤로',
            }}
        />
    </Stack.Navigator>
);


const TabBar = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: '#D7DDF0',
                },
                tabBarItemStyle: { paddingTop: 10 },
                tabBarActiveTintColor: '#2D336B',
                tabBarInactiveTintColor: '#9A9FC3',
                headerShown: false,
            }}
        >
            <Tab.Screen
                name="MainStack"
                component={MainStack}
                options={{
                    tabBarShowLabel: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='home' color={color} size={28} />
                    )
                }}
            />
            <Tab.Screen
                name="Recipe"
                component={RecipeStack}
                options={{
                    tabBarShowLabel: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='restaurant' color={color} size={28} />
                    )
                }}
            />
            <Tab.Screen
                name="Bill"
                component={Bill}
                options={{
                    tabBarShowLabel: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='receipt' color={color} size={28} />
                    )
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileStack}
                options={{
                    tabBarShowLabel: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name='person-circle' color={color} size={31} />
                    )
                }}
            />
        </Tab.Navigator>
    );
};


export default TabBar;
