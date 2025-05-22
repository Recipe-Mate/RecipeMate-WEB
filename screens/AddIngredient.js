import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Image, Alert, Platform, Image as RNImage } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import UnitPicker from "./UnitPicker";
import { SERVER_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
const defaultImage = RNImage.resolveAssetSource(require('../assets/default.png'));

export default function AddIngredient({ route, navigation }) {
    const { foodName, amount, unit } = route.params || {};
    const [image, setImage] = useState(null);
    const [foodNameState, setFoodName] = useState(foodName || '');
    const [amountState, setAmount] = useState(amount ? String(amount) : '');
    const [unitState, setUnit] = useState(unit || '');

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

    const addFood = async (foodList, imageFiles) => {
        try {
            const formData = new FormData();
            formData.append('foodDataList', {
                string: JSON.stringify({ foodList }),
                name: 'foodDataList.json',
                type: 'application/json',
            });

            if (Array.isArray(imageFiles)) {
                imageFiles.forEach((image, index) => {
                    formData.append('images', {
                        uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
                        type: image.type || 'image/jpeg',
                        name: image.fileName || `image${index}.jpg`,
                    });
                });
            } else if (imageFiles) {
                formData.append('images', {
                    uri: Platform.OS === 'android' ? imageFiles.uri : imageFiles.uri.replace('file://', ''),
                    type: imageFiles.type || 'image/jpeg',
                    name: imageFiles.fileName || 'image.jpg',
                });
            }

            const accessToken = await AsyncStorage.getItem('accessToken');

            const response = await fetch(`${SERVER_URL}/food`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('서버 오류:', response.status, errorText);
                throw new Error('업로드 실패');
            }

            const responseData = await response.text();
            if (responseData) {
                const parsedData = JSON.parse(responseData);
                console.log('업로드 성공:', parsedData);
            } else {
                console.log('응답 본문이 비어있습니다.');
            }
        } catch (error) {
            console.error('에러 발생:', error.message);
        }
    };

    const handleSave = () => {
        if (!foodNameState || !amountState || !unitState) {
            Alert.alert('알림', '모든 필드를 입력하세요.');
            return;
        }

        const foodList = [
            {
                foodName: foodNameState,
                amount: amountState,
                unit: unitState
            }
        ];

        console.log('foodName: ', foodNameState);
        console.log('amount: ', amountState);
        console.log('unit: ', unitState);
        const imageData = image
            ? { uri: image, type: 'image/jpeg', name: 'uploaded.jpg' }
            : { uri: defaultImage.uri, type: 'image/jpeg', name: 'default.jpg' };
        addFood(foodList, imageData);

        navigation.goBack()
    };

    useEffect(() => {
        if (unit) {
            setUnit(unit);
        }
    }, [unit]);


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
                            value={foodNameState}
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
                            value={amountState}
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
                        <UnitPicker onSelect={setUnit} selected={unitState} />
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