import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { StatusBar, StyleSheet, View, Text, ActivityIndicator, LogBox } from 'react-native';
import apiConfig from './config/api.config';
import LinearGradient from 'react-native-linear-gradient';
import { SERVER_URL } from '@env';
import apiService from './src/services/api.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 경고 무시 설정 (개발 중에만 사용)
LogBox.ignoreLogs([
  'ViewManagerResolver returned null',  // RNSScreen 관련 경고 무시
  'ViewManagerRegistry.js',             // 화면 관련 경고 무시
  'ViewManager for component',           // 컴포넌트 관련 경고 무시
]);

// 현재 가지고 있는 화면들
import Main from './screens/Main';
import Profile from './screens/Profile';
import Receipt from './screens/Receipt';
import RecipeSearch from './screens/RecipeSearch';
import RecipeDetail from './screens/RecipeDetail';
import RecipeResult from './screens/RecipeResult';
import RecipeThumbnails from './screens/RecipeThumbnails';
import Login from './screens/Login';
import AddIngredient from './screens/AddIngredient';
import Badge from './screens/Badge';
import RecipeCompletedList from './screens/RecipeCompletedList';
import ReceiptTake from './screens/ReceiptTake';
import ReceiptChoose from './screens/ReceiptChoose';
import IngredientChange from './screens/IngredientChange';

// Context API 추가
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { UserIngredientsProvider } from './src/context/UserIngredientsContext';

// 초기화 화면 컴포넌트
const InitializingScreen = () => (
  <View style={styles.initializingContainer}>
    <ActivityIndicator size="large" color="#3498db" />
    <Text style={styles.initializingText}>앱을 초기화하는 중...</Text>
  </View>
);

// 메인 탭 네비게이터
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
          height: 60,
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

// 레시피 스택 네비게이터
const RecipeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="RecipeSearch"
      component={RecipeSearch}
      options={{ title: '레시피 검색', headerShown: false }}
    />
    <Stack.Screen
      name="RecipeDetail"
      component={RecipeDetail}
      options={{ title: '레시피 상세', headerShown: false }}
    />
    <Stack.Screen
      name="RecipeResult"
      component={RecipeResult}
      options={{
        headerStyle: {
          backgroundColor: '#A9B5DF',
          height: 60,
        },
        headerTintColor: '#2D336B',
        headerBackTitleStyle: {
          fontSize: 16,
        },
        title: '검색 결과',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: "600",
        },
        headerShown: true,
        headerShadowVisible: false,
        headerBackTitle: '뒤로',
      }}
    />
    <Stack.Screen
      name="RecipeThumbnails"
      component={RecipeThumbnails}
      options={{ title: '레시피 썸네일 목록', headerShown: true }} // 추가: headerShown: true
    />
    <Stack.Screen
      name="IngredientChange"
      component={IngredientChange}
      options={{ title: '재료 변동 사항', headerShown: false }}
    />
  </Stack.Navigator>
);

const ReceiptStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Receipt"
      component={Receipt}
      options={{ title: '영수증 스캔', headerShown: false }}
    />
    <Stack.Screen
      name="ReceiptTake"
      component={ReceiptTake}
      options={{ title: '영수증 스캔 결과',         
        headerStyle: {
          backgroundColor: '#A9B5DF',
          height: 60,
        }, 
      }}
    />
    <Stack.Screen
      name="ReceiptChoose"
      component={ReceiptChoose}
      options={{ title: '영수증 스캔 결과',         
        headerStyle: {
          backgroundColor: '#A9B5DF',
          height: 60,
        }, 
      }}
    />
  </Stack.Navigator>
);

// 인증되지 않은 사용자를 위한 스택
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {/* Login 화면 등록 */}
    <Stack.Screen name="Login" component={Login} />
  </Stack.Navigator>
);

// 메인 앱 컴포넌트 (사용자 인증 상태에 따라 다른 화면 표시)
const AppContent = ({ initialError }) => {
  const { isAuthenticated, loading } = useAuth();
  // 항상 인증된 상태로 처리
  // const alwaysAuthenticated = true;

  // 로딩 중일 때 초기화 화면 표시
  if (loading) {
    return <InitializingScreen />;
  }

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
        name="RecipeCompletedList"
        component={RecipeCompletedList}
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
          },
          headerBackTitle: '뒤로',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      {isAuthenticated ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'MainStack') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'RecipeStack') {
                iconName = focused ? 'restaurant' : 'restaurant-outline';
              } else if (route.name === 'ReceiptStack') {
                iconName = focused ? 'receipt' : 'receipt-outline';
              } else if (route.name === 'ProfileStack') {
                iconName = focused ? 'person' : 'person-outline';
              } else if (route.name === 'ServerStatus') {
                // server 아이콘이 없으므로 settings로 대체
                iconName = focused ? 'settings' : 'settings-outline';
              }

              // IconPlaceholder 대신 아이콘 직접 사용
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#525C99',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen
            name="MainStack"
            component={MainStack}
            options={{ title: '홈', headerShown: false }}
          />
          <Tab.Screen
            name="RecipeStack"
            component={RecipeStack}
            options={{ title: '레시피', headerShown: false }}
          />
          <Tab.Screen
            name="ReceiptStack"
            component={ReceiptStack}
            options={{ title: '영수증 스캔', headerShown: false }}
          />
          <Tab.Screen
            name="ProfileStack"
            component={ProfileStack}
            options={{ title: '프로필', headerShown: false }}
          />
        </Tab.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

// 최상위 앱 컴포넌트
const App = () => {
  const [isInitialized, setIsInitialized] = useState(true); // 기본값을 true로 설정하여 초기화 화면 건너뛰기
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    // 앱 시작 시 accessToken을 AsyncStorage에서 읽어와 apiService에 설정
    const initializeAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          apiService.setToken(token);
          console.log('[App] accessToken을 apiService에 설정:', token);
        } else {
          console.log('[App] accessToken 없음, apiService 토큰 미설정');
        }
      } catch (e) {
        console.warn('[App] accessToken 초기화 실패:', e);
      }
    };
    initializeAuthToken();
  }, []);

  useEffect(() => {
    // 백그라운드에서 초기화 진행
    const initializeAppInBackground = async () => {
      try {
        console.log('백그라운드에서 앱 초기화 시작...');
        // Metro 서버 로그만 출력
        if (__DEV__) {
          console.log('개발 모드 실행 중');
          console.log('Metro URL:', `${SERVER_URL}`);
        }

        // 서버 설정 초기화는 비동기적으로 백그라운드에서 수행
        apiConfig.initializeServerConfig().then(result => {
          if (!result.success) {
            console.warn('서버 설정을 가져오는 데 실패했습니다. 기본 URL을 사용합니다.');
          }
        }).catch(error => {
          console.error('서버 설정 초기화 중 오류:', error);
        });
      } catch (error) {
        console.error('앱 초기화 중 오류가 발생했습니다:', error);
        setInitError(error.message);
      }
    };

    // 초기화를 백그라운드에서 실행
    initializeAppInBackground();
  }, []);

  // 초기화 화면을 표시하지 않고 바로 앱 내용 표시
  return (
    <AuthProvider>
      <UserIngredientsProvider>
        <AppContent initialError={initError} />
      </UserIngredientsProvider>
    </AuthProvider>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5FCFF',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 16,
  },
  instruction: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginTop: 16,
  },
  initializingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  initializingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#4CAF50',
  },
});

export default App;