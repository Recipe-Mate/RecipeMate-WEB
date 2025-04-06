import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { setToken } from '../src/services/api.service';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Login] 로그인 시도:', email);
      
      const result = await login(email, password);
      console.log('[Login] 로그인 결과:', result);
      
      if (!result.success) {
        if (result.error) {
          console.error('[Login] 로그인 실패 상세:', result.error);
        }
        Alert.alert('로그인 실패', result.error || '로그인에 실패했습니다. 다시 시도해주세요.');
      } else {
        console.log('[Login] 로그인 성공');
        // 네비게이션 코드 제거 - 인증 상태 변경만으로 자동 전환됨
        // 로그인 성공 시 AuthContext에서 isAuthenticated가 true로 설정되어
        // App.js에서 자동으로 Tab.Navigator로 전환됩니다.
      }
    } catch (error) {
      console.error('[Login] 로그인 처리 중 예외 발생:', error);
      Alert.alert('오류 발생', '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Icon name="restaurant" size={60} color="#ffffff" />
          </View>
          <Text style={styles.title}>RecipeMate</Text>
          <Text style={styles.subtitle}>나만의 요리 비서</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpText}>계정이 없으신가요? 회원가입</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 RecipeMate. All rights reserved.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signUpText: {
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 14,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 12,
  },
});

export default Login;