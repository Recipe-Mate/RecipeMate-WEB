import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Settings 컴포넌트: 설정 화면을 렌더링함
const Settings = () => {
  return (
    <View style={styles.container}>
      {/* 화면 중앙에 설정 화면 텍스트 표시 */}
      <Text style={styles.text}>Setting Screen</Text>
    </View>
  );
};

// 스타일 정의함
const styles = StyleSheet.create({
  container: {
    flex: 1, // 화면 전체를 차지함
    justifyContent: 'center', // 세로 중앙 정렬
    alignItems: 'center', // 가로 중앙 정렬
    backgroundColor: '#fff', // 배경색 설정
  },
  text: {
    fontSize: 20, // 글자 크기 설정
    fontWeight: 'bold', // 글자 두께 설정
  },
});

export default Settings; // Settings 컴포넌트를 외부로 내보냄