import React, { useState, useRef } from "react";
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, Keyboard } from "react-native";

const RAW_UNIT_OPTIONS = [
  { label: "개", value: "개" },
  { label: "병", value: "병" },
  { label: "봉지", value: "봉지" },
  { label: "KG", value: "KG" },
  { label: "G", value: "G" },
  { label: "mg", value: "mg" },
  { label: "ml", value: "ml" },
  { label: "L", value: "L" },
  { label: "컵", value: "컵" },
  { label: "스푼", value: "스푼" },
  { label: "조각", value: "조각" },
  { label: "장", value: "장" },
  { label: "쪽", value: "쪽" },
  { label: "줄", value: "줄" },
  { label: "통", value: "통" },
  { label: "캔", value: "캔" },
  { label: "팩", value: "팩" },
  { label: "알", value: "알" },
  { label: "마리", value: "마리" },
  { label: "회", value: "회" },
  { label: "번", value: "번" },
  { label: "줄기", value: "줄기" },
  { label: "덩어리", value: "덩어리" },
  { label: "oz", value: "oz" },
  { label: "lb", value: "lb" },
  { label: "tsp", value: "tsp" },
  { label: "tbsp", value: "tbsp" },
  { label: "cup", value: "cup" },
  { label: "slice", value: "slice" },
  { label: "sheet", value: "sheet" },
  { label: "piece", value: "piece" },
  { label: "stick", value: "stick" },
  { label: "block", value: "block" },
  { label: "bottle", value: "bottle" },
  { label: "bag", value: "bag" },
  { label: "box", value: "box" },
  { label: "pack", value: "pack" },
  { label: "can", value: "can" },
  { label: "jar", value: "jar" },
  { label: "tube", value: "tube" },
  { label: "bundle", value: "bundle" },
  { label: "bunch", value: "bunch" },
];
const UNIT_OPTIONS = Array.from(new Map(RAW_UNIT_OPTIONS.map(item => [item.value, item])).values());

const UnitPicker = ({ onSelect, value }) => {
  const [input, setInput] = useState(value || "");
  const [showList, setShowList] = useState(false);
  const inputRef = useRef(null);

  // value prop이 바뀌면 input도 무조건 동기화 (focus 중이어도)
  React.useEffect(() => {
    if (typeof value === 'string' && value !== input) {
      setInput(value);
      if (inputRef.current) {
        inputRef.current.setNativeProps({ text: value });
      }
    }
  }, [value]);

  // 입력값으로 시작하는 단위만 자동완성
  const filtered = input.length === 0
    ? UNIT_OPTIONS
    : UNIT_OPTIONS.filter(item =>
        item.label.toLowerCase().startsWith(input.toLowerCase()) ||
        item.value.toLowerCase().startsWith(input.toLowerCase())
      );

  // 리스트에서 선택할 때만 onSelect 호출
  const handleSelect = (val) => {
    setInput(val);
    setShowList(false);
    Keyboard.dismiss();
    if (onSelect) onSelect(val);
  };

  // 입력창에서 입력 시에는 setInput만 (onSelect 호출 X)
  const handleChange = (text) => {
    setInput(text);
    setShowList(true);
  };

  // 입력창에서 포커스가 해제될 때(드롭다운 닫힐 때) 입력값을 부모에 전달
  const handleBlur = () => {
    setTimeout(() => setShowList(false), 150);
    if (onSelect) onSelect(input);
  };

  return (
    <View style={{ zIndex: 2000 }}>
      {/* 오버레이를 드롭다운 아래에 배치 */}
      <View pointerEvents={showList ? 'box-none' : 'auto'}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="단위를 입력하세요"
          value={input}
          onChangeText={handleChange}
          onFocus={() => setShowList(true)}
          onBlur={handleBlur}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {showList && filtered.length > 0 && (
          <View style={[styles.dropdown, { zIndex: 3001 }]} pointerEvents="box-none">
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={filtered}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelect(item.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.itemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 180 }}
            />
          </View>
        )}
      </View>
      {/* 오버레이는 항상 맨 아래에 배치, 드롭다운보다 zIndex가 낮게 */}
      {showList && (
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}
          activeOpacity={1}
          onPress={() => setShowList(false)}
          pointerEvents="auto"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    backgroundColor: '#fff',
    height: 40,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  dropdown: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    zIndex: 2000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default UnitPicker;
