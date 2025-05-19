import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import apiService from '../src/services/api.service';
import { useAuth } from '../src/context/AuthContext';

const UserAddIngredient = ({ navigation }) => {
  const [foodName, setFoodName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('개');
  const { user } = useAuth();

  const handleAdd = async () => {
    if (!foodName.trim() || !amount.trim()) {
      Alert.alert('입력 오류', '식재료명과 수량을 입력하세요.');
      return;
    }
    const foodData = {
      foodList: [
        { foodName, amount: Number(amount), unit }
      ]
    };
    try {
      const res = await apiService.addFood(user?.id, foodData);
      if (res.success) {
        Alert.alert('성공', '식재료가 추가되었습니다.');
        navigation.goBack();
      } else {
        Alert.alert('실패', res.error || '식재료 추가에 실패했습니다.');
      }
    } catch (e) {
      Alert.alert('오류', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>내 식재료 추가</Text>
      <TextInput
        style={styles.input}
        placeholder="식재료명"
        value={foodName}
        onChangeText={setFoodName}
      />
      <TextInput
        style={styles.input}
        placeholder="수량"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="단위 (예: 개, g, ml)"
        value={unit}
        onChangeText={setUnit}
      />
      <TouchableOpacity style={styles.button} onPress={handleAdd}>
        <Text style={styles.buttonText}>추가하기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#3498db', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default UserAddIngredient;
