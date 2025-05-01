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
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import apiConfig from '../config/api.config';

const SignUp = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSignUp = async () => {
    // 입력 유효성 검사
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('입력 오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('비밀번호 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[회원가입] 회원가입 시도:', email);
      
      // 회원가입 요청
      const userData = {
        userName: name,  // 'name'을 'userName'으로 변경
        email,
        password
      };
      
      const url = `${apiConfig.getApiUrl()}/api/signup`;
      console.log('[회원가입] 요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('[회원가입] 성공:', data);
        Alert.alert(
          '회원가입 성공',
          '회원가입이 완료되었습니다. 로그인해주세요.',
          [{ text: '확인', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        console.error('[회원가입] 실패:', data);
        Alert.alert('회원가입 실패', data.message || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('[회원가입] 오류:', error);
      Alert.alert('네트워크 오류', '서버에 연결할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>회원가입</Text>
        
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="이름"
            value={name}
            onChangeText={setName}
          />
          
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
          
          <TextInput
            style={styles.input}
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.signUpButtonText}>회원가입</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>이미 계정이 있으신가요? 로그인</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  signUpButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  signUpButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginText: {
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 14,
  },
});

export default SignUp;
