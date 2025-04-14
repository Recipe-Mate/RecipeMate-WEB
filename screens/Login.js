import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import apiConfig from '../config/api.config';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('unknown'); // 서버 상태 추가
  const { login } = useAuth();

  // 컴포넌트 마운트 시 서버 상태 확인
  useEffect(() => {
    checkServerStatus();
  }, []);

  // 서버 연결 상태 확인 함수
  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      const response = await fetch(`${apiConfig.getApiUrl()}/api/system/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        timeout: 5000 // 5초 타임아웃
      });
      
      if (response.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      console.error('서버 상태 확인 실패:', error);
      setServerStatus('offline');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    // 서버가 오프라인 상태인지 확인
    if (serverStatus === 'offline') {
      Alert.alert(
        '서버 연결 오류',
        '서버에 연결할 수 없습니다. 네트워크 연결을 확인하거나 나중에 다시 시도해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '재연결 시도', onPress: () => {
            checkServerStatus();
          }}
        ]
      );
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
      }
    } catch (error) {
      console.error('[Login] 로그인 처리 중 예외 발생:', error);
      // 네트워크 오류 발생 시 더 구체적인 메시지 표시
      if (error.message && error.message.includes('Network request failed')) {
        Alert.alert(
          '네트워크 오류', 
          '서버에 연결할 수 없습니다. 인터넷 연결을 확인하고 다시 시도해주세요.',
          [
            { text: '확인' },
            { text: '서버 상태 확인', onPress: checkServerStatus }
          ]
        );
      } else {
        Alert.alert('오류 발생', '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
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

        {/* 서버 상태 표시 */}
        <View style={styles.serverStatusContainer}>
          {serverStatus === 'checking' && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.statusChecking}>서버 연결 확인 중...</Text>
            </View>
          )}
          
          {serverStatus === 'online' && (
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, styles.statusOnline]} />
              <Text style={styles.statusOnlineText}>서버 연결됨</Text>
            </View>
          )}
          
          {serverStatus === 'offline' && (
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, styles.statusOffline]} />
              <Text style={styles.statusOfflineText}>서버 연결 실패</Text>
              <TouchableOpacity onPress={checkServerStatus} style={styles.retryButton}>
                <Text style={styles.retryText}>재시도</Text>
              </TouchableOpacity>
            </View>
          )}
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
            style={[
              styles.loginButton,
              serverStatus === 'offline' && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading || serverStatus === 'offline'}
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
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  serverStatusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  statusOnline: {
    backgroundColor: '#3498db',
  },
  statusOffline: {
    backgroundColor: '#3498db',
  },
  statusOnlineText: {
    color: '#3498db',
    fontSize: 14,
  },
  statusOfflineText: {
    color: '#F44336',
    fontSize: 14,
    marginRight: 8,
  },
  statusChecking: {
    color: '#757575',
    marginLeft: 8,
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  retryText: {
    color: '#424242',
    fontSize: 12,
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
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#A5D6A7',
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