import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../src/context/AuthContext';
import apiService from '../src/services/api.service';

const AddFood = ({ navigation }) => {
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const getUserId = () => {
    if (!user) return null;
    if (user.id) return user.id; // PK 우선
    if (user.user_id) return user.user_id;
    if (user.user && user.user.user_id) return user.user.user_id;
    return null;
  };

  // 식재료명에서 단위/수량/괄호 등 제거 (예: "오렌지 100g(1/2개)" → "오렌지")
  const extractPureName = (name) => name.replace(/\s*\d+[a-zA-Z가-힣()\/\.]*|\([^)]*\)/g, '').trim();

  const handleAddFood = async () => {
    console.log('[AddFood] user:', user);
    const userId = getUserId();
    if (!foodName.trim()) {
      Alert.alert('입력 오류', '식재료 이름을 입력해주세요.');
      return;
    }
    if (!userId) {
      Alert.alert('로그인 필요', '식재료 추가는 로그인 후 이용 가능합니다.');
      return;
    }
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
      Alert.alert('유저 정보 오류', '유저 ID가 올바르지 않습니다. 다시 로그인해 주세요.');
      return;
    }
    setIsLoading(true);
    try {
      // 수량과 단위를 각각 전송
      const foodData = {
        foodNameList: [extractPureName(foodName.trim())], // 순수 식재료명만 전송
        quantityList: [quantity.trim()],
        unitList: [unit.trim()]
      };
      console.log('[AddFood] 식재료 추가 요청:', foodData);
      const response = await apiService.addFood(numericUserId, foodData);
      console.log('[AddFood] 응답:', response);
      if (response.success) {
        Alert.alert(
          '추가 성공',
          '식재료가 성공적으로 추가되었습니다.',
          [{ 
            text: '확인', 
            onPress: () => {
              navigation.navigate('FoodList', { 
                refresh: true, 
                timestamp: Date.now()
              });
            }
          }]
        );
      } else {
        throw new Error(response.error || '식재료 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('[AddFood] 오류:', error);
      let errorMessage = '식재료 추가 중 오류가 발생했습니다.';
      if (error.message) {
        if (error.message.includes('405')) {
          errorMessage = '서버에서 요청을 처리할 수 없습니다. (메소드 허용되지 않음)';
        } else if (error.message.includes('400')) {
          errorMessage = '잘못된 요청입니다. 입력 데이터를 확인해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      Alert.alert('오류 발생', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>식재료 추가</Text>
      </View>
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>식재료 이름</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 감자, 양파, 당근 등"
          value={foodName}
          onChangeText={setFoodName}
        />
        
        <Text style={styles.label}>수량</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 2, 500, 1 등"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>단위</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 개, g, 봉지 등"
          value={unit}
          onChangeText={setUnit}
        />
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddFood}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Icon name="add" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>식재료 추가</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>TIP</Text>
        <Text style={styles.infoText}>
          수량과 단위를 각각 입력하세요. (예: 수량 2, 단위 개)
          추가한 식재료는 레시피 추천 시 활용됩니다.
          정확한 이름으로 입력하면 더 정확한 레시피를 추천받을 수 있습니다.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4', // 연한 초록 계열 배경
  },
  header: {
    padding: 15,
    backgroundColor: '#3498db',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  formContainer: {
    padding: 16,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#3498db',
  },
  input: {
    backgroundColor: '#f9fdf9',
    borderWidth: 1,
    borderColor: '#3498db', 
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 6,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  infoContainer: {
    padding: 16,
    margin: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#3498db', // 약간 어두운 초록
  },
  infoText: {
    fontSize: 14,
    color: '#3498db',
    lineHeight: 20,
  },
});

export default AddFood;
