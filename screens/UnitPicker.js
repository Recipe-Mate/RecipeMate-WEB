import React, { useState, useEffect } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import { View } from "react-native";

const UnitPicker = ({ onSelect, selected }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: "kg", value: "KG" },
    { label: "g", value: "G" },
    { label: "mg", value: "MG" },
    { label: "ml", value: "ML" },
    { label: "L", value: "L" },
    { label: "개", value: "EA" },
  ]);

  // selected prop이 주어지면 초기값 설정
  useEffect(() => {
    if (selected) {
      setValue(selected);
    }
  }, [selected]);

  return (
    <View>
      <DropDownPicker
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={(callback) => {
          const newValue = callback(value); // callback(value)로 새 값 얻음
          setValue(newValue);
          onSelect(newValue);
        }}
        setItems={setItems}
        placeholderStyle={{
          color: "#aaa",
          fontSize: 16,
        }}
        placeholder="단위를 선택하세요"
        style={{
          height: 40,
          width: "100%",
          borderColor: "#ccc",
          borderRadius: 10,
        }}
        containerStyle={{
          marginBottom: 10,
          borderColor: "#000",
        }}
        zIndex={2000}
        elevation={2}
      />
    </View>
  );
};

export default UnitPicker;
