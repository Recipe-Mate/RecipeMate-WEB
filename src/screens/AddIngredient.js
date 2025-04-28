import React, { useState } from "react";
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import CategoryPicker from "../service/CategoryPicker";
import ExpiryDatePicker from "../service/ExpiryDatePicker";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import UnitPicker from "../service/UnitPicker";

export default function AddIngredient({ navigation }) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [image, setImage] = useState(null);
    const [foodName, setFoodName] = useState('');
    const [amount, setAmount] = useState('');
    const [unit, setUnit] = useState('');

    const serverUrl = process.env.SERVER_URL;

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("권한 필요", "이미지를 선택하려면 갤러리 접근 권한이 필요합니다.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // 정사각형 비율
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri); // 선택한 이미지 적용
        }
    };

    const addFood = () => {
        console.log('This is addFood')
        var foodToSend = {
            "foodList": [
                {
                  "foodName": foodName,
                  "amount": amount,
                  "unit": unit
                }
              ]
        }
        fetch(`${serverUrl}/food`, {
          method: 'POST',
          body: JSON.stringify(foodToSend),
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((responseJson) => {
            console.log(responseJson);
          })
    };

    const handleSave = () => {
        console.log('식재료명: ', foodName)
        console.log('개수/용량: ', amount)
        console.log('단위:', unit);
        addFood();
        navigation.navigate('Main')
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar style="light" />
            <LinearGradient
                colors={["#2D336B", "#A9B5DF"]}
                style={styles.background}
            />
            <View style={styles.box}>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                    <TouchableOpacity onPress={pickImage}>
                        <View style={styles.profile_image}>
                            {image ? (
                                <Image source={{ uri: image }} style={styles.image} />
                            ) : (
                                <View style={styles.placeholder}>
                                    <Image source={require("../../assets/upload-icon.png")} style={styles.uploadIcon} />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
                <View style={styles.divider}></View>
                <View>
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
                    {/* <View style={styles.divider}></View>
                    <View style={styles.type_view}>
                        <View style={styles.text1_view}>
                            <Text style={styles.text1}>카테고리</Text>
                        </View>
                        <View style={styles.type_input_view}>
                            <CategoryPicker onSelect={setSelectedCategory} />
                        </View>
                    </View> */}
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

                    {/* <View style={styles.type_view}>
                        <View style={styles.text1_view}>
                            <Text style={styles.text1}>소비기한</Text>
                        </View>
                        <View style={styles.type_input_view}>
                            <ExpiryDatePicker onSelect={setSelectedDate} />
                        </View>
                    </View>
                    <View style={styles.divider}></View> */}

                </View>
                <View style={styles.save_view}>
                    <TouchableOpacity
                        style={styles.save_button}
                        // onPress={addFood}
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
    background: {
        ...StyleSheet.absoluteFillObject,
    },
    buttonText: {
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 10,
    },
    option: {
        padding: 5,
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#cccccc',
        marginHorizontal: 4,        // space between butons
        paddingHorizontal: 12       // space between text and border
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
    selectedButton: {
        backgroundColor: 'black',
    },
    selectedText: {
        color: 'white',
    },
    screen: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    text1: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D336B',
    },
    text1_view: {
        flex: 1,
        justifyContent: 'center',
    },
    text2: {
        fontSize: 17,
        marginVertical: 7,
        color: '#777'
    },
    type_input: {
        marginVertical: 7,
        fontSize: 16,
    },
    type_input_view: {
        flex: 2.5,
        justifyContent: 'center'
    },
    type_view: {
        flexDirection: 'row',
    },
    safeArea: {
        backgroundColor: "#2D336B",
        flex: 1,
    },
    box: {
        flex: 11,
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 20,
        margin: 10,
        marginBottom: -30,
    },
});