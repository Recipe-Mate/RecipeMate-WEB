import React from 'react';
import { StyleSheet, View, ActivityIndicator, Modal } from 'react-native';

// Loader 컴포넌트: 로딩 상태를 시각적으로 표시하는 컴포넌트임
const Loader = ({ loading, backgroundColor = 'rgba(0, 0, 0, 0.5)' }) => {
  return (
    // 로딩 상태일 때만 표시되는 모달임
    <Modal
      transparent={true} // 배경을 투명하게 설정함
      animationType="fade" // 페이드 효과를 적용함
      visible={loading} // 로딩 상태에 따라 모달을 표시함
      onRequestClose={() => {}} // Android Back 버튼 동작을 무시함
    >
      {/* 모달 내부 화면 레이아웃 */}
      <View style={[styles.container, { backgroundColor }]}>
        {/* 로딩 인디케이터 표시함 */}
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    </Modal>
  );
};

// 스타일 정의함
const styles = StyleSheet.create({
  container: {
    flex: 1, // 화면 전체를 차지함
    justifyContent: 'center', // 세로 중앙 정렬함
    alignItems: 'center', // 가로 중앙 정렬함
  },
});

export default Loader; // Loader 컴포넌트를 외부로 내보냄