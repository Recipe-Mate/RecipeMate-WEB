import React, { useState } from "react";
import DropDownPicker from "react-native-dropdown-picker";
import { View } from "react-native";

const UnitPicker = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: "개", value: "EA" },
    { label: "병", value: "병" },
    { label: "KG", value: "KG" },
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
