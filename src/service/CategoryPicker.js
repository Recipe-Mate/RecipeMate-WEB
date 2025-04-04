import React, { useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import { View } from "react-native";

const CategoryPicker = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: "채소", value: "vegetables" },
    { label: "과일", value: "fruits" },
    { label: "육류", value: "meat" },
    { label: "해산물", value: "seafood" },
    { label: "유제품", value: "dairy" },
    { label: "기타", value: "others" },
  ]);  

  return (
    <View>
      <DropDownPicker
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={(val) => {
          setValue(val);
          onSelect(val);
        }}
        setItems={setItems}
        placeholderStyle={{
          color: "#aaa",
          fontSize: 16,
        }}
        placeholder="카테고리를 선택하세요"
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

export default CategoryPicker;
