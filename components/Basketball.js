import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Basketball = (props) => {
  const { body, size } = props;
  const { position } = body;
  const { angle } = body;
  
  const x = position.x - size / 2;
  const y = position.y - size / 2;
  
  // Simple basketball component with gradient and lines
  return (
    <View
      style={[
        styles.ball,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ rotate: angle + 'rad' }]
        }
      ]}
    >
      <LinearGradient
        colors={['#FFA500', '#FF8C00']}
        style={styles.gradient}
      >
        <View style={[styles.line, styles.horizontalLine]} />
        <View style={[styles.line, styles.verticalLine]} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  ball: {
    position: 'absolute',
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    position: 'absolute',
  },
  horizontalLine: {
    width: '100%',
    height: '6%',
  },
  verticalLine: {
    height: '100%',
    width: '6%',
  },
});

export default Basketball;
