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
  ToastAndroid
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import apiConfig from '../config/api.config';

const Register = ({ navigation, route }) => { // route prop 추가
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPasswordChk, setUserPasswordChk] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register } = useAuth();

  // 카카오 로그인에서 넘어온 kakaoId 파라미터
  const kakaoId = route?.params?.kakaoId;

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
      
      const url = `${apiConfig.getApiUrl()}/api/signup`;
      // kakaoId가 있으면 payload에 포함
      const payload = kakaoId ? {
        name: userName,
        email: userEmail,
        password: userPassword,
        kakaoId: kakaoId
      } : {
        name: userName,
        email: userEmail,
        password: userPassword
      };
      
      console.log('[회원가입] 요청 URL:', url);
      console.log('[회원가입] 요청 데이터:', payload);
      
      // 네트워크 요청 전에 서버 상태 확인
      try {
        console.log('[회원가입] 서버 상태 확인 시작');
        const healthCheck = await fetch(`${apiConfig.getApiUrl()}/api/system/health`, {
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
        return;
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
        
        // 응답에서 userId 확인
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
          Object.keys(result).forEach(key => {
            if (key.toLowerCase().includes('id') || key.toLowerCase().includes('userid')) {
              userId = result[key];
              console.log(`[회원가입] ID 필드 발견: ${key} = ${userId}`);
            }
          });
        }
        
        console.log('[회원가입] 최종 추출된 사용자 ID:', userId);
        
        // 즉시 Alert 표시
        Alert.alert(
          '회원가입 성공',
          `회원가입이 완료되었습니다.\n\n사용자 ID: ${userId}\n\n이 ID는 중요합니다. 기억해두세요.`,
          [{ 
            text: '확인', 
            onPress: () => {
              if (Platform.OS === 'android') {
                ToastAndroid.show(
                  `회원가입 성공! ID: ${userId}`,
                  ToastAndroid.LONG
                );
              }
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

  if (isSuccess) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>카카오 회원가입</Text>
        {/* 카카오 아이디 안내 및 버튼 */}
        {kakaoId && (
          <View style={styles.kakaoBox}>
            <Text style={styles.kakaoText}>카카오 계정으로 회원가입합니다.</Text>
            <Text style={styles.kakaoIdText}>카카오 ID: {kakaoId}</Text>
            <TextInput
              style={styles.input}
              placeholder="닉네임"
              onChangeText={setUserName}
              value={userName}
            />
            <TouchableOpacity
              style={styles.kakaoButton}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.kakaoButtonText}>
                🟡 카카오 아이디로 가입하기
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  },
  kakaoBox: {
    backgroundColor: '#FBE301',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  kakaoText: {
    color: '#3B1E1E',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  kakaoIdText: {
    color: '#3B1E1E',
    fontSize: 14,
    marginBottom: 10,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  kakaoButtonText: {
    color: '#3B1E1E',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.5,
  },
});

export default Register;