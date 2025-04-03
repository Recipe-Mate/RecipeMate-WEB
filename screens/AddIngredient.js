import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import CategoryPicker from "./CategoryPicker";
import ExpiryDatePicker from "./ExpiryDatePicker";

export default function AddIngredient() {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedContactTerm, setSelectedContactTerm] = useState([]);

    const toggleContactTerm = (item) => {
        setSelectedContactTerm((prev) =>
            prev.includes(item) ? prev.filter(term => term !== item) : [...prev, item]
        );
    };

    return (
        <View style={styles.screen}>
            <View style={styles.profile_image}>
            </View>
            <View style={styles.divider}></View>
            <View>
                <View style={styles.type_view}>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.text1}>식재료명</Text>
                    </View>
                    <View style={{ flex: 2.5, justifyContent: 'center' }}>
                        <TextInput style={styles.type_input} placeholder='재료를 입력하세요' />
                    </View>
                </View>
                <View style={styles.divider}></View>
                <View style={styles.type_view}>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.text1}>카테고리</Text>
                    </View>
                    <View style={{ flex: 2.5, justifyContent: 'center' }}>
                        <CategoryPicker onSelect={setSelectedCategory} />
                    </View>
                </View>
                <View style={styles.divider}></View>
                <View style={styles.type_view}>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.text1}>개수/용량</Text>
                    </View>
                    <View style={{ flex: 2.5, justifyContent: 'center' }}>
                        <TextInput style={styles.type_input} placeholder='숫자를 입력하세요' />
                    </View>
                </View>
                <View style={styles.divider}></View>
                <View style={styles.type_view}>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.text1}>소비기한</Text>
                    </View>
                    <View style={{ flex: 2.5, justifyContent: 'center' }}>
                        <ExpiryDatePicker onSelect={setSelectedDate} />
                    </View>
                </View>
            </View>
            {/* <View style={styles.divider}></View>
            <View>
                <Text style={{ fontSize: 17, fontWeight: 'bold', marginVertical: 9 }}>소비기한</Text>
                <View style={styles.type_view}>
                    <View style={{ flex: 2, justifyContent: 'center' }}>
                        <ExpiryDatePicker onSelect={setSelectedDate} />
                    </View>
                </View>

                
            </View> */}
            <View style={styles.divider}></View>
            <View style={styles.add_person_view}>
                <TouchableOpacity
                    style={styles.add_person_button}>
                    <Text style={{ color: '#ffffff', fontSize: 16 }}>저장</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    add_person_view: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 30,
        backgroundColor: '#ffffff'
    },
    add_person_button: {
        backgroundColor: '#000000',
        padding: 8,
        borderRadius: 8,
        paddingHorizontal: 18,
        justifyContent: 'center'
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
        height: 200,
        backgroundColor: '#ccc'
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
    },
    text2: {
        fontSize: 17,
        marginVertical: 7,
        color: '#777'
    },
    type_input: {
        marginVertical: 7,
        fontSize: 16
    },
    type_view: {
        flexDirection: 'row',
    },
});