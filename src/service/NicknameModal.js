// NicknameModal.js
import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const NicknameModal = ({
    visible,
    setVisible,
    newNickname,
    setNewNickname,
    handleNicknameChange,
    styles,
}) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={() => setVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle}>닉네임 변경하기</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="변경할 닉네임을 입력하세요"
                        placeholderTextColor="#333f50"
                        value={newNickname}
                        onChangeText={setNewNickname}
                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleNicknameChange}
                        >
                            <Text style={styles.buttonText1}>변경</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setVisible(false)}
                        >
                            <Text style={styles.buttonText2}>취소</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};



export default NicknameModal;
