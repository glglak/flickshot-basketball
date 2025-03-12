import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { GameContext } from '../App';

const { width } = Dimensions.get('window');
const TOTAL_LEVELS = 20; // Total number of levels in the game

const LevelSelectScreen = ({ navigation }) => {
  const { unlockedLevels, highScores, soundEnabled } = useContext(GameContext);
  
  // Generate array of level numbers
  const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1);
  
  // Play sound effect
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
  
  // Handle level selection
  const handleLevelSelect = (level) => {
    // Check if level is unlocked
    if (level <= unlockedLevels) {
      playButtonSound();
      navigation.navigate('Game', { level });
    }
  };
  
  // Render level item
  const renderLevelItem = ({ item: level }) => {
    const isUnlocked = level <= unlockedLevels;
    const highScore = highScores[level] || 0;
    
    // Determine star rating based on high score
    const stars = getStarRating(highScore);
    
    return (
      <TouchableOpacity
        style={[
          styles.levelButton,
          !isUnlocked && styles.lockedLevel,
        ]}
        onPress={() => handleLevelSelect(level)}
        disabled={!isUnlocked}
        activeOpacity={isUnlocked ? 0.7 : 1}
      >
        <Text style={[styles.levelNumber, !isUnlocked && styles.lockedText]}>
          {level}
        </Text>
        
        {isUnlocked ? (
          // Show star rating for unlocked levels
          <View style={styles.starsContainer}>
            {[1, 2, 3].map((star) => (
              <FontAwesome5
                key={star}
                name="star"
                size={15}
                color={star <= stars ? '#FFD700' : '#ccc'}
                solid={star <= stars}
              />
            ))}
          </View>
        ) : (
          // Show lock icon for locked levels
          <FontAwesome5 name="lock" size={16} color="#777" />
        )}
        
        {isUnlocked && highScore > 0 && (
          <Text style={styles.highScoreText}>
            {highScore}
          </Text>
        )}
      </TouchableOpacity>
    );
  };
  
  // Calculate star rating based on score
  const getStarRating = (score) => {
    if (score === 0) return 0;
    if (score < 100) return 1;
    if (score < 200) return 2;
    return 3;
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Level</Text>
      
      <FlatList
        data={levels}
        renderItem={renderLevelItem}
        keyExtractor={(item) => item.toString()}
        numColumns={3}
        contentContainerStyle={styles.levelsContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  levelsContainer: {
    paddingBottom: 20,
  },
  levelButton: {
    width: (width - 60) / 3,
    aspectRatio: 1,
    backgroundColor: '#fff',
    margin: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  lockedLevel: {
    backgroundColor: '#e0e0e0',
    opacity: 0.7,
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f4511e',
    marginBottom: 5,
  },
  lockedText: {
    color: '#999',
  },
  starsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  highScoreText: {
    fontSize: 12,
    color: '#555',
    marginTop: 5,
  },
});

export default LevelSelectScreen;
