import React from 'react';
import { StyleSheet, View, ActivityIndicator, Modal } from 'react-native';

const Loader = ({ loading, backgroundColor = 'rgba(0, 0, 0, 0.5)' }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={loading}
      onRequestClose={() => {}} // Android Back 버튼 무시
    >
      <View style={[styles.container, { backgroundColor }]}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Loader;
