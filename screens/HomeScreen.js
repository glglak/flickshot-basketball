import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { GameContext } from '../App';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { totalScore, soundEnabled } = useContext(GameContext);
  const bounceAnim = new Animated.Value(0);
  const rotateAnim = new Animated.Value(0);
  
  // Sound effect
  const playButtonSound = async () => {
    if (!soundEnabled) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/button_click.mp3')
      );
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };
  
  // Animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
    
    return () => {
      bounceAnim.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, []);
  
  // Transform calculations for animations
  const ballScale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });
  
  const ballTranslateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Navigation handlers
  const handlePlayPress = () => {
    playButtonSound();
    navigation.navigate('LevelSelect');
  };
  
  const handleTutorialPress = () => {
    playButtonSound();
    navigation.navigate('Tutorial');
  };
  
  const handleSettingsPress = () => {
    playButtonSound();
    navigation.navigate('Settings');
  };
  
  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>FlickShot</Text>
        <Text style={styles.subtitle}>Basketball Challenge</Text>
      </View>
      
      {/* Animated Basketball */}
      <View style={styles.ballContainer}>
        <Animated.View
          style={[
            styles.ballWrapper,
            {
              transform: [
                { scale: ballScale },
                { translateY: ballTranslateY },
                { rotate: spin },
              ],
            },
          ]}
        >
          <View style={styles.ball}>
            <View style={[styles.ballLine, styles.horizontalLine]} />
            <View style={[styles.ballLine, styles.verticalLine]} />
          </View>
        </Animated.View>
      </View>
      
      {/* Total Score */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreTitle}>Total Score</Text>
        <Text style={styles.scoreValue}>{totalScore}</Text>
      </View>
      
      {/* Menu Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handlePlayPress}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="play" size={20} color="#fff" />
          <Text style={styles.buttonText}>Play</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleTutorialPress}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="question-circle" size={20} color="#fff" />
          <Text style={styles.buttonText}>How to Play</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleSettingsPress}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="cog" size={20} color="#fff" />
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f4511e',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 22,
    color: '#555',
    marginTop: 5,
  },
  ballContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballWrapper: {
    width: 100,
    height: 100,
  },
  ball: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#ff8c00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  ballLine: {
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
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreTitle: {
    fontSize: 18,
    color: '#555',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    width: '80%',
  },
  button: {
    backgroundColor: '#f4511e',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default HomeScreen;
