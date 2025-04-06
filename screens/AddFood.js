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
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  
  const handleAddFood = async () => {
    if (!foodName.trim()) {
      Alert.alert('입력 오류', '식재료 이름을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    try {
      const userId = user?.id || 3; // 실제 로그인 사용자 ID 또는 기본값
      
      // MySQL 테이블 구조에 맞게 데이터 객체 생성
      // food_name, foodName 필드 모두 있으므로 둘 다 채움
      const foodData = {
        userId: userId,
        user_id: userId,
        foodName: foodName.trim(),
        food_name: foodName.trim(),
        quantity: quantity.trim() || '1개' // quantity 필드 추가 (테이블에 있음)
      };
      
      console.log('[AddFood] 식재료 추가 요청:', foodData);
      
      const response = await apiService.addFood(foodData);
      console.log('[AddFood] 응답:', response);
      
      if (response.data && response.data.success) {
        Alert.alert(
          '추가 성공',
          '식재료가 성공적으로 추가되었습니다.',
          [{ text: '확인', onPress: () => {
            // 명시적으로 refresh 파라미터를 true로 설정하여 목록 갱신 보장
            navigation.navigate('FoodList', { refresh: true });
          }}]
        );
      } else {
        throw new Error(response.data?.message || '식재료 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('[AddFood] 오류:', error);
      
      // 오류 메시지 개선
      let errorMessage = '식재료 추가 중 오류가 발생했습니다.';
      if (error.message) {
        if (error.message.includes('405')) {
          errorMessage = '서버에서 요청을 처리할 수 없습니다. (메소드 허용되지 않음)';
        } else if (error.message.includes('400')) {
          errorMessage = '잘못된 요청입니다. 입력 데이터를 확인해주세요.';
        } else {
          errorMessage = error.message; // 서버에서 반환한 오류 메시지 표시
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
        
        <Text style={styles.label}>수량 (선택사항)</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 500g, 2개, 1봉지 등"
          value={quantity}
          onChangeText={setQuantity}
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
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 15,
    backgroundColor: '#4CAF50',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#4CAF50',
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
    color: '#2E7D32',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default AddFood;
