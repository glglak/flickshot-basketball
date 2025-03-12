import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { GameContext } from '../App';

const { width, height } = Dimensions.get('window');

const ResultScreen = ({ route, navigation }) => {
  const { level, score, isLevelCompleted } = route.params;
  const { updateHighScore, unlockLevel, updateTotalScore, highScores, soundEnabled } = useContext(GameContext);
  const [showNewHighScore, setShowNewHighScore] = useState(false);
  const [stars, setStars] = useState(0);
  
  // Animation values
  const scoreAnim = new Animated.Value(0);
  const starsAnim = new Animated.Value(0);
  const buttonsAnim = new Animated.Value(0);
  
  // Effects
  useEffect(() => {
    // Play sound
    const playResultSound = async () => {
      if (!soundEnabled) return;
      
      try {
        const soundFile = isLevelCompleted 
          ? require('../assets/sounds/level_complete.mp3')
          : require('../assets/sounds/level_failed.mp3');
          
        const { sound } = await Audio.Sound.createAsync(soundFile);
        await sound.playAsync();
      } catch (error) {
        console.log('Error playing sound:', error);
      }
    };
    
    playResultSound();
    
    // Update high score and unlock next level if completed
    if (isLevelCompleted) {
      const prevHighScore = highScores[level] || 0;
      const isNewHighScore = score > prevHighScore;
      
      setShowNewHighScore(isNewHighScore);
      
      if (isNewHighScore) {
        updateHighScore(level, score);
      }
      
      // Unlock next level
      unlockLevel(level + 1);
      
      // Update total score (only add the difference if it's a new high score)
      if (isNewHighScore) {
        updateTotalScore(score - prevHighScore);
      }
      
      // Calculate stars
      const starsEarned = getStarRating(score);
      setStars(starsEarned);
    }
    
    // Run animations
    Animated.sequence([
      Animated.timing(scoreAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(starsAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Play button sound
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
  
  // Calculate star rating based on score
  const getStarRating = (score) => {
    if (score === 0) return 0;
    if (score < 100) return 1;
    if (score < 200) return 2;
    return 3;
  };
  
  // Navigation handlers
  const handleRetryPress = () => {
    playButtonSound();
    navigation.replace('Game', { level });
  };
  
  const handleNextLevelPress = () => {
    playButtonSound();
    navigation.replace('Game', { level: level + 1 });
  };
  
  const handleMenuPress = () => {
    playButtonSound();
    navigation.navigate('LevelSelect');
  };
  
  // Animation styles
  const scoreAnimStyle = {
    transform: [
      {
        translateY: scoreAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, 0],
        }),
      },
      {
        scale: scoreAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1.2, 1],
        }),
      },
    ],
    opacity: scoreAnim,
  };
  
  const starsAnimStyle = {
    transform: [
      {
        scale: starsAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 1.3, 1],
        }),
      },
    ],
    opacity: starsAnim,
  };
  
  const buttonsAnimStyle = {
    transform: [
      {
        translateY: buttonsAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
    opacity: buttonsAnim,
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <Text style={styles.title}>
          {isLevelCompleted ? 'Level Complete!' : 'Level Failed!'}
        </Text>
        
        {/* Score */}
        <Animated.View style={[styles.scoreContainer, scoreAnimStyle]}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          
          {showNewHighScore && (
            <Text style={styles.newHighScore}>New High Score!</Text>
          )}
        </Animated.View>
        
        {/* Stars (only show if level completed) */}
        {isLevelCompleted && (
          <Animated.View style={[styles.starsContainer, starsAnimStyle]}>
            {[1, 2, 3].map((star) => (
              <FontAwesome5
                key={star}
                name="star"
                size={40}
                color={star <= stars ? '#FFD700' : '#ccc'}
                solid={star <= stars}
                style={styles.star}
              />
            ))}
          </Animated.View>
        )}
        
        {/* Buttons */}
        <Animated.View style={[styles.buttonContainer, buttonsAnimStyle]}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRetryPress}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="redo" size={20} color="#fff" />
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
          
          {isLevelCompleted && (
            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={handleNextLevelPress}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="arrow-right" size={20} color="#fff" />
              <Text style={styles.buttonText}>Next Level</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.menuButton]}
            onPress={handleMenuPress}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="list" size={20} color="#fff" />
            <Text style={styles.buttonText}>Level Menu</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f4511e',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#555',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  newHighScore: {
    fontSize: 16,
    color: '#f4511e',
    fontWeight: 'bold',
    marginTop: 5,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  star: {
    marginHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
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
  nextButton: {
    backgroundColor: '#4CAF50',
  },
  menuButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ResultScreen;
