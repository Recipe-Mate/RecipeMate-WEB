import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Image, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import UnitPicker from "./UnitPicker";
import { SERVER_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddIngredient({ navigation }) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [image, setImage] = useState(null);
    const [foodName, setFoodName] = useState('');
    const [amount, setAmount] = useState('');
    const [unit, setUnit] = useState('');

    const handleUploadPhoto = async () => {
        try {
            console.log('이미지 선택 시작');
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 1,
                includeBase64: false, 
            });

            if (result.didCancel) {
                console.log('사용자가 이미지 선택을 취소했습니다');
                return;
            }

            if (result.errorCode) {
                console.error('이미지 선택 오류:', result.errorMessage);
                Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다: ' + result.errorMessage);
                return;
            }

            if (result.assets && result.assets.length > 0) {
                const selected = result.assets[0];
                console.log('선택된 이미지:', selected.uri);
                setImage(selected.uri);
            }
        } catch (error) {
            console.error('이미지 업로드 처리 오류:', error);
            Alert.alert('이미지 업로드 실패', '이미지를 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };
    
    const addFood = async (foodList, imageFile) => {
        try {
            const formData = new FormData();
    
            // 음식 목록을 JSON 형태로 formData에 추가
            formData.append('requestBody', JSON.stringify({ foodList }));
    
            // 이미지가 존재할 경우에만 이미지 파일 추가
            if (imageFile) {
                formData.append('images', {
                    uri: imageFile.uri,
                    type: imageFile.type,
                    name: imageFile.name,
                });
            } else {
                console.log('이미지 없이 요청');
            }
    
            const accessToken = await AsyncStorage.getItem('accessToken');
            console.log('accessToken:', accessToken);  // accessToken 값 확인
    
            if (!accessToken) {
                console.error('Access token이 없습니다.');
                Alert.alert('토큰 오류', '토큰이 유효하지 않습니다. 다시 로그인해 주세요.');
                return;
            }
    
            const response = await fetch(`${SERVER_URL}/food`, {
                method: 'POST',
                headers: {
                    'accept': '*/*',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error('서버 오류:', response.status, errorText);
                throw new Error('음식 데이터 전송 실패');
            }
    
            const data = await response.json();
            console.log('서버 응답 데이터:', data);
        } catch (error) {
            console.error('에러 발생:', error);
        }
    };
    
    
    
      

    const handleSave = () => {
        if (!foodName || !amount || !unit) {
            Alert.alert('알림', '모든 필드를 입력하세요.');
            return;
        }
    
        const foodList = [
            {
                foodName: foodName,
                amount: amount,
                unit: unit
            }
        ];
    
        // 이미지가 있으면 전달하고 없으면 null로 전달
        addFood(foodList, image ? { uri: image, type: 'image/jpeg', name: 'uploaded.jpg' } : null);
        
        navigation.navigate('Main');
    };
    
    
    

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient colors={["#2D336B", "#A9B5DF"]} style={styles.background} />
            <View style={styles.box}>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                    <TouchableOpacity onPress={handleUploadPhoto}>
                        <View style={styles.profile_image}>
                            {image ? (
                                <Image source={{ uri: image }} style={styles.image} />
                            ) : (
                                <View style={styles.placeholder}>
                                    <Image source={require("../assets/upload-icon.png")} style={styles.uploadIcon} />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.divider}></View>

                <View style={styles.type_view}>
                    <View style={styles.text1_view}>
                        <Text style={styles.text1}>식재료명</Text>
                    </View>
                    <View style={styles.type_input_view}>
                        <TextInput
                            style={styles.type_input}
                            placeholder='재료를 입력하세요'
                            placeholderTextColor="#aaa"
                            value={foodName}
                            onChangeText={setFoodName}
                        />
                    </View>
                </View>

                <View style={styles.divider}></View>
                <View style={styles.type_view}>
                    <View style={styles.text1_view}>
                        <Text style={styles.text1}>개수/용량</Text>
                    </View>
                    <View style={styles.type_input_view}>
                        <TextInput
                            style={styles.type_input}
                            placeholder="숫자를 입력하세요"
                            placeholderTextColor="#aaa"
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="phone-pad"
                        />
                    </View>
                </View>

                <View style={styles.divider}></View>
                <View style={styles.type_view}>
                    <View style={styles.text1_view}>
                        <Text style={styles.text1}>단위</Text>
                    </View>
                    <View style={styles.type_input_view}>
                        <UnitPicker onSelect={setUnit} />
                    </View>
                </View>

                <View style={styles.divider}></View>
                <View style={styles.save_view}>
                    <TouchableOpacity
                        style={styles.save_button}
                        onPress={handleSave}
                    >
                        <Text style={styles.save_button_text}>저장</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: "#2D336B",
        flex: 1,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    box: {
        flex: 11,
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 20,
        margin: 10,
        marginBottom: -30,
    },
    profile_image: {
        width: 170,
        height: 170,
        borderRadius: 20,
        backgroundColor: "#E0E0E0",
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: 20,
    },
    placeholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    uploadIcon: {
        width: 55,
        height: 55,
        opacity: 0.5,
    },
    type_view: {
        flexDirection: 'row',
    },
    text1_view: {
        flex: 1,
        justifyContent: 'center',
    },
    text1: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D336B',
    },
    type_input_view: {
        flex: 2.5,
        justifyContent: 'center',
    },
    type_input: {
        marginVertical: 7,
        fontSize: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 10,
    },
    save_view: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        marginTop: 40,
    },
    save_button: {
        backgroundColor: '#2D336B',
        borderRadius: 10,
        paddingHorizontal: 18,
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: 50,
    },
    save_button_text: {
        color: '#ffffff',
        fontSize: 20,
        marginHorizontal: 10,
        marginVertical: 5,
    },
});
