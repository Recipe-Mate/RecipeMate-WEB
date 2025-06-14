import React from 'react';
import { StatusBar } from 'react-native';
import { StyleSheet, Text, View, FlatList, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Main from "./Main";
import RecipeSearch from './RecipeSearch';
import RecipeDetail from './RecipeDetail';
import Bill from "./Receipt";
import Profile from "./Profile";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const MainStack = () => (
    <Stack.Navigator initialRouteName='Main'>
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
                    backgroundColor: '#2D336B',
                    height: 80,
                },
                headerTintColor: '#ffffff',
                headerBackTitleStyle: {
                    fontSize: 16,
                },
                title: '식재료 추가하기',
                headerTitleStyle: {
                    fontSize: 20,
                    fontWeight: "600",
                },
                headerShown: true,
                headerShadowVisible: false,
                headerBackTitle: '뒤로',
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
                    backgroundColor: '#333f50',
                },
                headerTintColor: '#ffffff',
                headerBackTitleStyle: {
                    fontSize: 16,
                },
                title: '획득한 배지',
                headerShown: true,
                headerBackTitle: '뒤로',
            }}
        />
        <Stack.Screen
            name="CookedRecipes"
            component={CookedRecipes}
            options={{
                headerBackground: () => (
                    <LinearGradient
                        colors={['#2D336B', '#525C99']}
                        style={{ flex: 1, borderBottomRightRadius: 10, borderBottomLeftRadius: 10, }}
                    />
                ),
                headerTintColor: '#ffffff',
                headerBackTitleStyle: {
                    fontSize: 16,
                },
                title: '요리한 레시피 목록',
                headerTitleStyle: {
                    fontSize: 20,
                    fontWeight: "600",
                    paddingBottom: 10,
                },
                headerBackTitle: '뒤로',
                headerShown: true,
                headerLeftContainerStyle: {
                    paddingBottom: 10,
                },
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
                name="RecipeStack"
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
                name="ProfileStack"
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

export default TabBar;
