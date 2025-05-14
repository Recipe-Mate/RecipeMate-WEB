import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RecipeSearch from '../../screens/RecipeSearch'; // 경로 수정
import RecipeDetail from '../../screens/RecipeDetail'; // 경로 수정
import RecipeResult from '../../screens/RecipeResult'; // 경로 수정
import IngredientChange from '../../screens/IngredientChange'; // 경로 수정
import CookedRecipeDetailScreen from '../../screens/CookedRecipeDetailScreen'; // 새 스크린 import

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
        <Stack.Screen
            name="RecipeCompletedList"
            component={require('../../screens/RecipeCompletedList').default} // 경로 수정
            options={{ title: '조리 완료 레시피', headerShown: true }}
        />
        <Stack.Screen
            name="CookedRecipeDetailScreen" // 새 스크린 추가
            component={CookedRecipeDetailScreen}
            options={{ title: '최근 본 레시피 상세', headerShown: true }}
        />
    </Stack.Navigator>
);

export default RecipeStack;