import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import HomeScreen from './screens/HomeScreen';
import GameScreen from './screens/GameScreen';
import LevelSelectScreen from './screens/LevelSelectScreen';
import ResultScreen from './screens/ResultScreen';
import SettingsScreen from './screens/SettingsScreen';
import TutorialScreen from './screens/TutorialScreen';

// Create navigation stack
const Stack = createStackNavigator();

// Game state context
export const GameContext = React.createContext();

export default function App() {
  // Game state
  const [highScores, setHighScores] = useState({});
  const [totalScore, setTotalScore] = useState(0);
  const [unlockedLevels, setUnlockedLevels] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved game data
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const storedHighScores = await AsyncStorage.getItem('highScores');
        const storedUnlockedLevels = await AsyncStorage.getItem('unlockedLevels');
        const storedTotalScore = await AsyncStorage.getItem('totalScore');
        const storedSoundEnabled = await AsyncStorage.getItem('soundEnabled');
        
        if (storedHighScores) setHighScores(JSON.parse(storedHighScores));
        if (storedUnlockedLevels) setUnlockedLevels(parseInt(storedUnlockedLevels, 10));
        if (storedTotalScore) setTotalScore(parseInt(storedTotalScore, 10));
        if (storedSoundEnabled) setSoundEnabled(JSON.parse(storedSoundEnabled));
      } catch (error) {
        console.log('Error loading game data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGameData();
  }, []);
  
  // Save game data when it changes
  useEffect(() => {
    if (isLoading) return;
    
    const saveGameData = async () => {
      try {
        await AsyncStorage.setItem('highScores', JSON.stringify(highScores));
        await AsyncStorage.setItem('unlockedLevels', String(unlockedLevels));
        await AsyncStorage.setItem('totalScore', String(totalScore));
        await AsyncStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
      } catch (error) {
        console.log('Error saving game data:', error);
      }
    };
    
    saveGameData();
  }, [highScores, unlockedLevels, totalScore, soundEnabled, isLoading]);
  
  // Update high score for a level
  const updateHighScore = (level, score) => {
    setHighScores(prev => {
      const currentHighScore = prev[level] || 0;
      if (score > currentHighScore) {
        return { ...prev, [level]: score };
      }
      return prev;
    });
  };
  
  // Update total score
  const updateTotalScore = (additionalScore) => {
    setTotalScore(prev => prev + additionalScore);
  };
  
  // Unlock a new level
  const unlockLevel = (level) => {
    if (level > unlockedLevels) {
      setUnlockedLevels(level);
    }
  };
  
  // Toggle sound setting
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };
  
  // Reset game progress
  const resetProgress = async () => {
    try {
      await AsyncStorage.clear();
      setHighScores({});
      setTotalScore(0);
      setUnlockedLevels(1);
    } catch (error) {
      console.log('Error resetting progress:', error);
    }
  };
  
  // Create game context value
  const gameContextValue = {
    highScores,
    totalScore,
    unlockedLevels,
    soundEnabled,
    updateHighScore,
    updateTotalScore,
    unlockLevel,
    toggleSound,
    resetProgress,
  };
  
  if (isLoading) {
    // You could return a loading screen here
    return null;
  }
  
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <GameContext.Provider value={gameContextValue}>
        <Stack.Navigator 
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#f4511e',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'FlickShot' }}
          />
          <Stack.Screen 
            name="LevelSelect" 
            component={LevelSelectScreen}
            options={{ title: 'Select Level' }}
          />
          <Stack.Screen 
            name="Game" 
            component={GameScreen}
            options={({ route }) => ({ 
              title: `Level ${route.params?.level || 1}`,
              headerShown: false,
            })}
          />
          <Stack.Screen 
            name="Result" 
            component={ResultScreen}
            options={{ 
              title: 'Level Complete',
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
          <Stack.Screen 
            name="Tutorial" 
            component={TutorialScreen}
            options={{ title: 'How to Play' }}
          />
        </Stack.Navigator>
      </GameContext.Provider>
    </NavigationContainer>
  );
}
