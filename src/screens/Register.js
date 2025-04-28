import React, {useState, createRef} from 'react';


import 'react-native-gesture-handler';
// import RNPickerSelect from 'react-native-picker-select';
import Loader from './Loader';

import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Modal,
  ScrollView,
} from 'react-native';

const Register = (props) => {
  const [user_Name, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');  
  const [userPassword, setUserPassword] = useState('');
  const [userPasswordchk, setUserPasswordchk] = useState('');
  const [loading, setLoading] = useState(false);
  const [errortext, setErrortext] = useState('');
  const [errortext2, setErrortext2] = useState('');
  const [isRegistraionSuccess, setIsRegistraionSuccess] = useState(false);

  const idInputRef = createRef();
  const gradeInputRef = createRef();
  const passwordInputRef = createRef();
  const passwordchkInputRef = createRef();
  const nameInputRef = createRef();

  const handleSubmitButton = () => {
    setErrortext('');

    if (!user_Name) {
        alert('닉네임을 입력해주세요');
        return;
      }
    if (!userEmail) {
      alert('이메일을 입력해주세요');
      return;
    }
    if (!userPassword) {
      alert('비밀번호를 입력해주세요');
      return;
    }
    if (userPasswordchk != userPassword) {
      alert('비밀번호가 일치하지 않습니다');
      return;
    }
    //Show Loader
    setLoading(true);

    var dataToSend = {
      email: userEmail,
      password: userPassword,
      userName: user_Name
    };
    // var formBody = [];
    // for (var key in dataToSend) {
    //   var encodedKey = encodeURIComponent(key);
    //   var encodedValue = encodeURIComponent(dataToSend[key]);
    //   formBody.push(encodedKey + '=' + encodedValue);
    // }
    // formBody = formBody.join('&');

    // const response = await axios.post('https://56b5-182-221-151-160.ngrok-free.app/user/signup')



    fetch('https://60f3-182-221-151-160.ngrok-free.app/user/signup', {
      method: 'POST',
      body: JSON.stringify(dataToSend),
      headers: {
        //Header Defination
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        // 응답이 올바른 JSON인지 먼저 확인
        return response.text(); // 응답을 텍스트로 확인
      })
      .then((text) => {
        if (!text) {
          console.error('빈 응답이 반환되었습니다. 응답 본문이 없습니다.');
          throw new Error('빈 응답');
        }
        
        console.log('응답 본문:', text);  // 서버에서 반환된 응답 본문
        const responseJson = JSON.parse(text);  // 텍스트를 JSON으로 파싱
        return responseJson;
      })
      // .then((response) => response.text())
      .then((responseJson) => {
        //Hide Loader
        setLoading(false);
        setErrortext2('');
        console.log(responseJson);
        console.log(JSON.stringify(dataToSend));
        // If server response message same as Data Matched
        if (responseJson.status === 'success') {
          setIsRegistraionSuccess(true);
          console.log('Registration Successful. Please Login to proceed');
        } else if (responseJson.status === 'duplicate') {
          setErrortext2('이미 존재하는 아이디입니다.');
        }
      })
      .catch((error) => {
        //Hide Loader
        setLoading(false);
        console.error('There was a problem with the fetch operation:', error);
        console.log(JSON.stringify(dataToSend));

      });
  };

  if (isRegistraionSuccess) {
    return (
      <View style={styles.container}>
        <View style={{flex: 1}} />
        <View style={{flex: 2}}>
          <View
            style={{
              height: 13,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon name='check' size={20} color='black'></Icon>
            {/* <Image
              source={require('../src/success.png')}
              style={{
                height: 20,
                resizeMode: 'contain',
                alignSelf: 'center',
              }}
            /> */}
          </View>
          <View
            style={{
              height: 7,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text style={{color: 'black', fontSize: 15}}>
              회원가입이 완료되었습니다.
            </Text>
          </View>

          <View style={{height: 20, justifyContent: 'center'}}>
            <View style={styles.btnArea}>
              <TouchableOpacity
                style={styles.btn}
                activeOpacity={0.5}
                onPress={() => props.navigation.navigate('LogIn')}>
                <Text style={{color: 'white', fontSize: 15}}>
                  로그인하기
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Loader loading={loading} />
      <View style={styles.topArea}>
        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.Text}>회원가입하여 식재료를 편하게 관리하세요</Text>
      </View>

      <View style={styles.formArea}>
        <TextInput
            style={styles.textForm}
            placeholder={'닉네임을 입력하세요'}
            onChangeText={(user_Name) => setUserName(user_Name)}
            ref={nameInputRef}
            returnKeyType="next"
            onSubmitEditing={() =>
                gradeInputRef.current && gradeInputRef.current.focus()
            }
            blurOnSubmit={false}
        />
        <TextInput
          style={styles.textForm}
          placeholder={'이메일을 입력하세요'}
          onChangeText={(userEmail) => setUserEmail(userEmail)}
          ref={idInputRef}
          returnKeyType="next"
          onSubmitEditing={() =>
            passwordInputRef.current && passwordInputRef.current.focus()
          }
          blurOnSubmit={false}
        />
        <TextInput
          style={styles.textForm}
          secureTextEntry={true}
          placeholder={'비밀번호를 입력하세요'}
          onChangeText={(userPassword) => setUserPassword(userPassword)}
          ref={passwordInputRef}
          returnKeyType="next"
          onSubmitEditing={() =>
            passwordchkInputRef.current && passwordchkInputRef.current.focus()
          }
          blurOnSubmit={false}
        />
        <TextInput
          style={styles.textForm}
          secureTextEntry={true}
          placeholder={'비밀번호 확인'}
          onChangeText={(UserPasswordchk) =>
            setUserPasswordchk(UserPasswordchk)
          }
          ref={passwordchkInputRef}
          returnKeyType="next"
          onSubmitEditing={() =>
            nameInputRef.current && nameInputRef.current.focus()
          }
          blurOnSubmit={false}
        />
      </View>

      <View style={{flex: 0.5, justifyContent: 'center'}}>
        {userPassword !== userPasswordchk ? (
          <Text style={styles.TextValidation}>
            비밀번호가 일치하지 않습니다.
          </Text>
        ) : null}
      </View>

      <View style={{flex: 0.7, justifyContent: 'center'}}>
        {errortext2 !== '' ? (
          <Text style={styles.TextValidation}>{errortext2}</Text>
        ) : null}
      </View>

      <View style={{flex: 0.75, alignItems: 'center'}}>
        <View style={styles.btnArea}>
          <TouchableOpacity style={styles.btn} onPress={handleSubmitButton}>
            <Text style={{fontSize: '20', fontWeight: 'bold', color: '#ffffff'}}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{flex: 3}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  btnArea: {
    backgroundColor: '#333f50',
    width: '90%',
    height: 50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  topArea: {
    flex: 1.5,
    justifyContent: 'center',
  },
  title: {
    fontSize: 40,
    marginLeft: 25,
    fontWeight: 'bold',
    marginTop: 10
  },
  Text: {
    marginLeft: 25,
    marginTop: 10,
    fontSize: 20,
  },
  formArea: {
    width: '100%',
  },
  textForm: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 30,
    marginBottom: 15,
    paddingLeft: 15,
    fontSize: 16,
    margin: 15,
    marginBottom: 5,
    marginTop: 5,
  },
  TextValidation: {
    color: 'red',
    justifyContent: 'center',
  }
})

export default Register;