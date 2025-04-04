import React, { useState } from "react";
import { View, Button, Text, StyleSheet } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const ExpiryDatePicker = () => {
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  return (
    <View style={styles.container}>
      <Button title="날짜 선택" onPress={() => setDatePickerVisibility(true)} color="#7886C7" />
      <Text style={styles.dateText}>선택 날짜: {date.toDateString()}</Text>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={(selectedDate) => {
          setDate(selectedDate);
          setDatePickerVisibility(false);
        }}
        onCancel={() => setDatePickerVisibility(false)}
        textColor="black"
        headerTextIOS="소비기한 선택"
        confirmTextIOS="확인"
        cancelTextIOS="취소"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  dateText: {
    fontSize: 17,
    marginVertical: 6,
    color: '#2D336B',
  },
});

export default ExpiryDatePicker;
