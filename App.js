import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Main from './src/screens/Main';
import SplashScreen from './src/screens/SplashScreen';
import LogIn from './src/screens/LogIn';
import Register from './src/screens/Register';
import TabBar from './src/screens/TabBar';

const Stack = createStackNavigator();

// const LogInStack = () => (
//   <Stack.Navigator>
//       <Stack.Screen
//           name="LogIn"
//           component={LogIn}
//           options={{ headerShown: false }}
//       />
//       <Stack.Screen
//           name="Register"
//           component={Register}
//           options={{ title: '레시피 상세', headerShown: true }}
//       />
//   </Stack.Navigator>
// );


// const Auth = () => {
//   return (
//     <Stack.Navigator>
//       <Stack.Screen
//         name="LogInStack"
//         component={LogInStack}
//         options={{
//           title: '',
//           headerBackTitleVisible: false,
//         }}
//       />
//       <Stack.Screen
//         name="Register"
//         component={Register}
//         options={{
//           title: '',
//           headerBackTitleVisible: false,
//         }}
//       />
//     </Stack.Navigator>
//   );
// };

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
      {/* <Stack.Navigator initialRouteName="SplashScreen"> */}
        {/* SplashScreen */}
        {/* <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{ headerShown: false }}
        /> */}
        {/* Auth Navigator */}
        {/* <Stack.Screen
          name="Auth"
          component={Auth}
          options={{ headerShown: false }}
        /> */}
        {/* Drawer Navigation */}
        <Stack.Screen
          name="TabBar"
          component={TabBar}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
