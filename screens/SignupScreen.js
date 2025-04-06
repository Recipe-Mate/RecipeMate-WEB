const signUp = async (userData) => {
  try {
    const response = await fetch('http://172.18.16.1:8080/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    if (result.status === 'success') {
      // 회원가입 성공 처리
      navigation.replace('Login');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    Alert.alert('회원가입 실패', error.message);
  }
};
