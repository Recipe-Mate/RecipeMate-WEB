import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { StatusBar, StyleSheet, View, Text, ActivityIndicator, LogBox } from 'react-native';
import ServerStatusCheck from './src/components/ServerStatusCheck';
import apiConfig from './config/api.config';

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
import Login from './screens/Login';
import SignUp from './screens/SignUp';
import AddFood from './screens/AddFood'; // 추가된 화면
import FoodList from './screens/FoodList'; // 추가된 화면
import RecipeThumbnails from './screens/RecipeThumbnails';

// Context API 추가
import { AuthProvider, useAuth } from './src/context/AuthContext';

// 아이콘 대신 사용할 임시 컴포넌트를 실제 Icon 컴포넌트로 대체
const IconPlaceholder = ({ name, size, color }) => (
  <Icon name={name} size={size} color={color} />
);

// 서버 상태 화면 컴포넌트
const ServerStatusScreen = () => {
  return (
    <View style={styles.screenContainer}>
      <Text style={styles.welcomeText}>
        RecipeMate에 오신 것을 환영합니다!
      </Text>
      
      <ServerStatusCheck />
      
      <Text style={styles.instruction}>
        이 앱에서는 식재료를 관리하고 레시피를 추천받을 수 있습니다.
      </Text>
    </View>
  );
};

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

// 홈 스택 네비게이터 추가 - 식재료 관리 화면을 포함
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="MainScreen"
      component={Main}
      options={{ 
        title: '홈',
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#333333',
        },
        headerShown: true
      }}
    />
    <Stack.Screen
      name="AddFood"
      component={AddFood}
      options={{ title: '식재료 추가' }}
    />
    <Stack.Screen
      name="FoodList"
      component={FoodList}
      options={{ title: '내 식재료' }}
    />
  </Stack.Navigator>
);

// 레시피 스택 네비게이터
const RecipeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="RecipeSearch"
      component={RecipeSearch}
      options={{ title: '레시피 검색', headerShown: true }}
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
      name="RecipeThumbnails"
      component={RecipeThumbnails}
      options={{ title: '레시피 썸네일', headerShown: true }}
    />
  </Stack.Navigator>
);

// 인증되지 않은 사용자를 위한 스택
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {/* Login 화면 등록 */}
    <Stack.Screen name="Login" component={Login} />
    {/* SignUp 화면 등록 */}
    <Stack.Screen name="SignUp" component={SignUp} />
    {/* Register 화면이 필요한 경우 추가 */}
  </Stack.Navigator>
);

// 메인 앱 컴포넌트 (사용자 인증 상태에 따라 다른 화면 표시)
const AppContent = ({ initialError }) => {
  const { isAuthenticated, loading } = useAuth();
  // 항상 인증된 상태로 처리
  const alwaysAuthenticated = true;
  
  // 로딩 중일 때 초기화 화면 표시
  if (loading) {
    return <InitializingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      {(isAuthenticated || alwaysAuthenticated) ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Recipe') {
                iconName = focused ? 'restaurant' : 'restaurant-outline';
              } else if (route.name === 'Receipt') {
                iconName = focused ? 'receipt' : 'receipt-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              } else if (route.name === 'ServerStatus') {
                // server 아이콘이 없으므로 settings로 대체
                iconName = focused ? 'settings' : 'settings-outline';
              }

              // IconPlaceholder 대신 아이콘 직접 사용
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#3498db',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeStack} // Main 대신 HomeStack 사용
            options={{ 
              title: '홈', 
              headerShown: true,
              headerStyle: {
                backgroundColor: '#ffffff',
              },
              headerTitleStyle: {
                fontWeight: 'bold',
                color: '#333333',
              }
            }}
          />
          <Tab.Screen 
            name="Recipe" 
            component={RecipeStack} 
            options={{ title: '레시피', headerShown: false }}
          />
          <Tab.Screen 
            name="Receipt" 
            component={Receipt} 
            options={{ title: '영수증 스캔' }}
          />
          <Tab.Screen 
            name="Profile" 
            component={Profile} 
            options={{ title: '프로필' }}
          />
          <Tab.Screen 
            name="ServerStatus" 
            component={ServerStatusScreen} 
            options={{ title: '서버 상태' }}
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
    // 백그라운드에서 초기화 진행
    const initializeAppInBackground = async () => {
      try {
        console.log('백그라운드에서 앱 초기화 시작...');
        // Metro 서버 로그만 출력
        if (__DEV__) {
          console.log('개발 모드 실행 중');
          console.log('Metro URL:', `http://localhost:8081`);
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
      <AppContent initialError={initError} />
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