import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TabBar from './TabBar';


const LogIn = ({ navigation }) => {
  const [userEmail, setEmail] = useState('');
  const [uesrPassword, setPassword] = useState('');
  const [userId, setUserId] = useState(null); // 서버 응답값 저장

  const [isValidUser, setIsValidUser] = useState(false);  // userId check result
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setErrorText('');

    var dataToSend = {
      email: userEmail,
      password: uesrPassword
    };
    // const formBody = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;

    try {
      const response = await fetch('https://1828-182-221-151-160.ngrok-free.app/user/login', {
        method: 'POST',
        body: JSON.stringify(dataToSend),
        headers: {
          //Header Defination
          'Content-Type': 'application/json',
        },

      });

      const data = await response.json();
      console.log('서버 응답: ', data);

      // check userId exists or not
      if (data && data.userId) {
        setUserId(data.userId);
        console.log("41");
        window.userId = data.userId
        navigation.replace('TabBar');
      } else {
        console.log("failed");
        setErrorText('아이디와 비밀번호를 다시 확인해주세요');

      }
    } catch (error) {
      console.error('Error: ', error);
    }
  };




    // 12/18/2024 ver.
    // fetch('https://1828-182-221-151-160.ngrok-free.app/user/login', {
    //   method: 'POST',
    //   body: JSON.stringify(dataToSend),
    //   headers: {
    //     //Header Defination
    //     'Content-Type': 'application/json',
    //   },
    // })
    //   .then((response) => response.json())
    //   .then((responseJson) => {
    //     console.log(responseJson);  // 서버 응답 전체를 확인
    //     const userId = responseJson.userId; // 숫자 값 7이 저장됨
    //     console.log('Extracted userId:', userId);
    //     navigation.replace('TabBar');
    //     if (responseJson.status === 'success') {
    //       AsyncStorage.setItem('userId', responseJson.data.userId);
    //       console.log('39', responseJson.data.userID);
    //       navigation.replace('TabBar');
    //     } else {
    //       setErrorText('아이디와 비밀번호를 다시 확인해주세요');
    //       console.log('Please check your id or password');
    //       console.log('44 userId', userId);
    //     }
    //   })
      



      // .then((responseJson) => {
      //   //Hide Loader
      //   setLoading(false);
      //   console.log(responseJson);

      //   const userId = responseJson.userId; // 숫자 값 7이 저장됨
      //   console.log('Extracted userId:', userId);

      //   // If server response message same as Data Matched
      //   if (responseJson.status === 'success') {
      //     AsyncStorage.setItem('user_id', responseJson.data.stu_id);
      //     console.log(responseJson.data.stu_id);
      //     navigation.replace('DrawerNavigationRoutes');
      //   } else {
      //     setErrorText('아이디와 비밀번호를 다시 확인해주세요');
      //     console.log('Please check your id or password');
      //   }
      // })
      // .catch((error) => {
      //   //Hide Loader
      //   setLoading(false);
      //   console.error(error);
      // });
  
    
    




  //   try {
  //     const response = await fetch('https://56b5-182-221-151-160.ngrok-free.app/user/login', {
  //       method: 'POST',
  //       body: JSON.stringify(dataToSend),
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     });

  //     const responseJson = await response.json();
  //     setLoading(false);
  //     console.log('Response:', responseJson);

  //     if (responseJson.status === 'success') {
  //       // AsyncStorage에 userId 저장
  //       await AsyncStorage.setItem('user_id', JSON.stringify(responseJson.userId)); // userId 값을 JSON.stringify()로 변환하여 저장
  //       const savedUserId = await AsyncStorage.getItem('user_id'); // 저장된 값 확인
  //       console.log('Stored user_id:', savedUserId); // 콘솔로 저장된 값 출력
  //       navigation.replace('TabBar');
  //     } else {
  //       setErrorText('아이디와 비밀번호를 다시 확인해주세요');
  //     }
  //   } catch (error) {
  //     setLoading(false);
  //     setErrorText('서버와 연결할 수 없습니다.');
  //     console.log('Error:', error);
  //   }

  //   await AsyncStorage.setItem('user_id', JSON.stringify(responseJson.userId))
  //     .then(() => {
  //       console.log('user_id saved successfully');
  //       // AsyncStorage에서 바로 확인
  //       AsyncStorage.getItem('user_id')
  //         .then((value) => {
  //           console.log('Stored user_id:', value); // 저장된 값 출력
  //         })
  //         .catch((error) => {
  //           console.log('Error reading stored user_id:', error);
  //         });
  //     })
  //     .catch((error) => {
  //       console.log('Error saving user_id:', error);
  //     });
  //   // 저장 시
  //   await AsyncStorage.setItem('user_id', JSON.stringify(responseJson.userId));

  //   // 읽을 때
  //   const storedUserId = await AsyncStorage.getItem('user_id');
  //   const parsedUserId = storedUserId ? JSON.parse(storedUserId) : null;
  //   console.log('Parsed user_id:', parsedUserId);

  // };







  //   fetch('https://56b5-182-221-151-160.ngrok-free.app/user/login', {
  //     method: 'POST',
  //     body: JSON.stringify(dataToSend),
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   })
    
    
  //     .then((response) => response.json())
  //     .then((responseJson) => {
  //       setLoading(false);
  //       console.log('Response:', responseJson); // 서버 응답 출력



  //       AsyncStorage.setItem('user_id', responseJson.data.user_id)
  //         .then(() => {
  //           console.log('user_id saved');
  //           // 값을 바로 불러와서 확인
  //           AsyncStorage.getItem('user_id')
  //             .then((value) => console.log('Stored user_id:', value)); // 바로 확인
  //         })
  //         .catch((error) => {
  //           console.log('Error saving user_id:', error);
  //         });



  //       if (responseJson.status === 'success') {
  //         // 서버에서 받아온 user_id를 AsyncStorage에 저장
  //         AsyncStorage.setItem('userId', responseJson.data.userId);


  //         // 로그인 성공 시 화면 이동 (예: TabBar 화면으로)
  //         navigation.replace('TabBar');
  //       } else {
  //         setErrorText('아이디와 비밀번호를 다시 확인해주세요');
  //       }
  //       AsyncStorage.getItem('userId')
  //         .then((userId) => {
  //           console.log('Stored userId:', userId);
  //         })
  //         .catch((error) => {
  //           console.log('Error reading user_id from AsyncStorage:', error);
  //         });

  //     })
  //     .catch((error) => {
  //       setLoading(false);
  //       setErrorText('서버와 연결할 수 없습니다.');

  //     });
  //     console.log('user_id', userId);
  // };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={userEmail}
        onChangeText={(text) => setEmail(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={uesrPassword}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
      />
      {loading ? <ActivityIndicator size="large" color="#333f50" /> : null}
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
      <Button title="로그인" onPress={handleLogin} />
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.buttonText}>회원가입하기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default LogIn;
