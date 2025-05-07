import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import KakaoLogins from '@react-native-seoul/kakao-login';

const LogIn = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorText, setErrorText] = React.useState('');

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorText('');

    try {
      const result = await KakaoLogins.login();
      console.log('Kakao Login Success:', result);
      // 여기서 accessToken을 서버에 전달하거나 저장하면 됩니다.
    } catch (e) {
      console.error('Kakao Login Failed:', e);
      setErrorText('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator size="large" color="#333f50" />}
      {errorText !== '' && <Text style={styles.errorText}>{errorText}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>카카오 로그인</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FBE301",
    borderRadius: 10,
    borderWidth: 1,
    width: 250,
    height: 50,
    marginTop: 10,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#3B1E1E',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default LogIn;
