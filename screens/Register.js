import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid  // ToastAndroid 추가
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import apiConfig from '../config/api.config';

const Register = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPasswordChk, setUserPasswordChk] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register } = useAuth();

  // 회원가입 처리 함수
  const handleSignUp = async () => {
    // 입력 검증
    if (!userName.trim()) {
      Alert.alert('입력 오류', '이름을 입력해주세요.');
      return;
    }
    if (!userEmail.trim()) {
      Alert.alert('입력 오류', '이메일을 입력해주세요.');
      return;
    }
    if (!userPassword.trim()) {
      Alert.alert('입력 오류', '비밀번호를 입력해주세요.');
      return;
    }
    if (userPassword !== userPasswordChk) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[회원가입] 모든 환경 변수 확인:', process.env);
      console.log('[회원가입] 앱 버전:', require('../package.json').version);
      
      const url = `${apiConfig.BASE_URL}/api/signup`;
      const payload = {
        name: userName,
        email: userEmail,
        password: userPassword
      };
      
      console.log('[회원가입] 요청 URL:', url);
      console.log('[회원가입] 요청 데이터:', payload);
      
      // 네트워크 요청 전에 서버 상태 확인
      try {
        console.log('[회원가입] 서버 상태 확인 시작');
        const healthCheck = await fetch(`${apiConfig.BASE_URL}/api/system/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('[회원가입] 서버 상태 응답 코드:', healthCheck.status);
        const healthData = await healthCheck.text();
        console.log('[회원가입] 서버 상태 응답 내용:', healthData);
      } catch (healthError) {
        console.error('[회원가입] 서버 상태 확인 실패:', healthError);
        
        // 오류 발생 시 사용자에게 네트워크 문제를 알림
        Alert.alert(
          '서버 연결 오류',
          '서버에 연결할 수 없습니다. 다음을 확인해주세요:\n\n' +
          '1. 서버가 실행 중인지 확인\n' +
          '2. 네트워크 연결 확인\n' +
          '3. API URL 설정 확인',
          [{ text: '확인' }]
        );
        setIsLoading(false);
        return; // 여기서 함수 종료
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('[회원가입] 응답 상태:', response.status);
      
      const responseText = await response.text();
      console.log('[회원가입] 서버 응답 원본:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('[회원가입] JSON 파싱 실패:', jsonError);
        result = { error: responseText || '응답을 처리할 수 없습니다.' };
      }
      
      if (response.ok) {
        console.log('[회원가입] 성공:', result);
        
        // 응답에서 userId 확인 - 로그 출력 강화
        console.log('[회원가입] 응답 객체 전체:', JSON.stringify(result, null, 2));
        
        // userId를 확실히 추출
        let userId = 'unknown';
        
        if (result.userId) {
          userId = result.userId;
        } else if (result.user_id) {
          userId = result.user_id;
        } else if (result.id) {
          userId = result.id;
        } else if (typeof result === 'object') {
          // 객체의 모든 키 확인
          Object.keys(result).forEach(key => {
            if (key.toLowerCase().includes('id') || key.toLowerCase().includes('userid')) {
              userId = result[key];
              console.log(`[회원가입] ID 필드 발견: ${key} = ${userId}`);
            }
          });
        }
        
        console.log('[회원가입] 최종 추출된 사용자 ID:', userId);
        
        // 즉시 Alert 표시 - 가장 단순하게
        Alert.alert(
          '회원가입 성공',
          `회원가입이 완료되었습니다.\n\n사용자 ID: ${userId}\n\n이 ID는 중요합니다. 기억해두세요.`,
          [{ 
            text: '확인', 
            onPress: () => {
              // 로그인 화면으로 이동하기 전에 ID 다시 한번 표시 (안드로이드)
              if (Platform.OS === 'android') {
                ToastAndroid.show(
                  `회원가입 성공! ID: ${userId}`,
                  ToastAndroid.LONG
                );
              }
              
              // 약간의 지연 후 화면 전환
              setTimeout(() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }, 500);
            } 
          }]
        );
        
        setIsSuccess(true);
      } else {
        console.error('[회원가입] 실패:', result);
        let errorMsg = result.error || result.message || '회원가입 처리 중 오류가 발생했습니다.';
        Alert.alert('회원가입 실패', errorMsg);
      }
    } catch (error) {
      console.error('[회원가입] 요청 오류:', error);
      Alert.alert(
        '네트워크 오류',
        '서버에 연결할 수 없습니다. 네트워크 연결을 확인하세요.',
        [{ text: '확인' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // isSuccess 상태가 true일 때 비어있는 화면 반환
  if (isSuccess) {
    return null; // Alert가 표시되고 그 후 이동됨
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>회원가입</Text>
        <TextInput
          style={styles.input}
          placeholder="닉네임"
          onChangeText={setUserName}
          value={userName}
        />
        <TextInput
          style={styles.input}
          placeholder="이메일"
          onChangeText={setUserEmail}
          value={userEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          secureTextEntry
          onChangeText={setUserPassword}
          value={userPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호 확인"
          secureTextEntry
          onChangeText={setUserPasswordChk}
          value={userPasswordChk}
        />
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '처리 중...' : '회원가입'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>이미 계정이 있으신가요? 로그인하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#4CAF50',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#4CAF50',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  successText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  successButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    alignSelf: 'center',
  }
});

export default Register;