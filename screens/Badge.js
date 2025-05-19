import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Badge = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to the Badge Screen!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
  },
});

export default Badge;
