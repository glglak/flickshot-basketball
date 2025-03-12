import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { GameContext } from '../App';

const SettingsScreen = () => {
  const { soundEnabled, toggleSound, resetProgress } = useContext(GameContext);
  
  // Handle reset progress
  const handleResetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all progress? This will clear all high scores and locked levels.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          onPress: resetProgress,
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      {/* Sound Toggle */}
      <View style={styles.settingItem}>
        <View style={styles.settingLeft}>
          <FontAwesome5 name="volume-up" size={24} color="#555" />
          <Text style={styles.settingText}>Sound Effects</Text>
        </View>
        <Switch
          value={soundEnabled}
          onValueChange={toggleSound}
          trackColor={{ false: '#ccc', true: '#f4511e' }}
          thumbColor={soundEnabled ? '#fff' : '#f0f0f0'}
        />
      </View>
      
      {/* About Section */}
      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>About FlickShot</Text>
        <Text style={styles.aboutText}>
          FlickShot is a physics-based basketball game where you can test your skills 
          in various challenging levels. Swipe and shoot to make the perfect basket!
        </Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
      
      {/* Reset Progress Button */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleResetProgress}
        activeOpacity={0.7}
      >
        <FontAwesome5 name="trash-alt" size={18} color="#fff" />
        <Text style={styles.resetButtonText}>Reset Progress</Text>
      </TouchableOpacity>
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
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 18,
    marginLeft: 15,
    color: '#333',
  },
  aboutSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  aboutText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 15,
  },
  versionText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'right',
  },
  resetButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default SettingsScreen;
