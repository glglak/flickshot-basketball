import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Basketball = (props) => {
  const { body, size } = props;
  const { position } = body;
  const { angle } = body;
  
  const x = position.x - size / 2;
  const y = position.y - size / 2;
  
  // Add a pulsing animation to make the ball more visible
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);
  
  // Simple basketball component with gradient and lines
  return (
    <Animated.View
      style={[
        styles.ball,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [
            { rotate: angle + 'rad' },
            { scale: pulseAnim } // Add subtle pulse effect
          ]
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  ball: {
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
