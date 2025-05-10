import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView,
  TouchableOpacity, SafeAreaView, Image, Modal
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SERVER_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Main = ({ navigation }) => {
  const [foodNameList, setFoodNameList] = useState([]);
  const [selectedRelationship, setSelectedRelationship] = useState("전체");
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev);
  };

  useEffect(() => {
    const fetchFoodList = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) return;

        const response = await fetch(`${SERVER_URL}/food/ownlist`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const data = await response.json();
        const parsedItems = data.ownFoodList.map(item => ({
          id: item.foodId,
          name: item.foodName,
          unit: item.unit,
          imageUrl: item.imgUrl,
          amount: item.amount,
        }));

        setFoodNameList(parsedItems);
        await AsyncStorage.setItem('num_of_items', parsedItems.length.toString());
      } catch (error) {
        console.error('Food List 요청 실패:', error);
      }
    };

    fetchFoodList();
  }, []);

  const handleDelete = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`${SERVER_URL}/food`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'accept': '*/*',
        },
        body: JSON.stringify({
          foodIdList: [itemToDelete.id]
        }),
      });
  
      if (!response.ok) throw new Error('삭제 실패');
  
      setFoodNameList(prev => prev.filter(item => item.id !== itemToDelete.id));
      setDeleteModalVisible(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('삭제 중 오류 발생:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#2D336B", "#A9B5DF"]} style={styles.background} />

      <View style={{ flexDirection: 'row', alignItems: 'center', height: 50, paddingTop: 9 }}>
        <Text style={styles.title}>식재료 목록</Text>
        <View style={styles.icon}>
          <TouchableOpacity style={styles.badge_button} onPress={() => navigation.navigate('AddIngredient')}>
            <Icon name='add' size={40} color='#fff' />
          </TouchableOpacity>
          <TouchableOpacity style={styles.badge_button} onPress={toggleEditMode}>
            <Icon name='edit' size={30} color='#fff' />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.box}>
        {/* <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', marginBottom: 15 }}>
            {['전체', '채소', '과일', '육류', '해산물', '유제품', '기타'].map(item => (
              <TouchableOpacity
                key={item}
                style={[styles.option, selectedRelationship === item && styles.selectedButton]}
                onPress={() => setSelectedRelationship(selectedRelationship === item ? null : item)}>
                <Text style={[styles.buttonText, selectedRelationship === item && styles.selectedText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView> */}

        <FlatList
          data={foodNameList}
          keyExtractor={(item, index) => item?.id?.toString?.() ?? index.toString()}
          key={3}
          numColumns={3}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text>이미지 없음</Text>
                </View>
              )}
              <Text style={styles.name}>{item.name}</Text>
              <View style={{ flexDirection: 'row' }}>
                <Text style={styles.category}>{item.amount}</Text>
                <Text style={styles.category}>{item.unit === 'EA' ? '개' : item.unit}</Text>
              </View>
              {isEditMode && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    setItemToDelete(item);
                    setDeleteModalVisible(true);
                  }}>
                  <Icon name="close" size={18} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>

      {/* 삭제 확인 모달 */}
      {deleteModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>정말 삭제하시겠습니까?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.addButton]} onPress={handleDelete}>
                <Text style={styles.buttonText1}>삭제</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.buttonText2}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#186FF2",
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#fff',
    paddingLeft: 15,
  },
  icon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    paddingRight: 20,
  },
  badge_button: {
    marginLeft: 5,
  },
  box: {
    flex: 11,
    backgroundColor: '#ffffff',
    padding: 10,
    margin: 10,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    marginBottom: -15,
  },
  gridItem: {
    width: '33%',
    padding: 8,
    position: 'relative',
  },
  photo: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    borderColor: '#A9B5DF',
    borderWidth: 1,
  },
  photoPlaceholder: {
    width: "100%",
    height: 90,
    borderRadius: 10,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontWeight: '600',
    fontSize: 17,
    marginTop: 5,
  },
  category: {
    color: '#7886C7',
    marginLeft: 3,
    fontSize: 16,
  },
  option: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E2550',
    marginRight: 6,
    paddingHorizontal: 12,
  },
  selectedButton: {
    backgroundColor: '#1E2550',
  },
  selectedText: {
    color: 'white',
  },
  buttonText: {
    fontWeight: '600',
    marginVertical: 3,
  },
  deleteButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'red',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 15,
  },
  button: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginHorizontal: 5,
  },
  addButton: {
    backgroundColor: '#333f50',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  buttonText1: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  buttonText2: {
    color: '#333f50',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default Main;
