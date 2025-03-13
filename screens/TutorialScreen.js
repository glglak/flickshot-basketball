import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const TutorialScreen = ({ navigation }) => {
  // Tutorial steps
  const tutorialSteps = [
    {
      id: 1,
      title: 'Aim & Shoot',
      description: "Swipe backward to aim, then release to shoot the ball. The longer you swipe, the more power you'll apply.",
      icon: 'hand-point-up',
    },
    {
      id: 2,
      title: 'Watch the Trajectory',
      description: "As you aim, you'll see a dotted line showing the predicted path. Use this to perfect your shots!",
      icon: 'route',
    },
    {
      id: 3,
      title: 'Navigate Obstacles',
      description: "Later levels feature obstacles you'll need to shoot around or use strategically to bank shots.",
      icon: 'shapes',
    },
    {
      id: 4,
      title: 'Earn Stars',
      description: "Each level awards up to 3 stars based on your score. Higher scores come from fewer attempts and trick shots!",
      icon: 'star',
    },
    {
      id: 5,
      title: 'Unlock Levels',
      description: "Successfully complete a level to unlock the next one. The game gets progressively more challenging!",
      icon: 'unlock',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How to Play</Text>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {tutorialSteps.map((step) => (
          <View key={step.id} style={styles.stepContainer}>
            <View style={styles.stepIconContainer}>
              <FontAwesome5 name={step.icon} size={30} color="#f4511e" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          </View>
        ))}
        
        <View style={styles.tipContainer}>
          <Text style={styles.tipTitle}>Pro Tips:</Text>
          <Text style={styles.tipText}>• Use the backboard for bank shots</Text>
          <Text style={styles.tipText}>• Adjust your power based on distance</Text>
          <Text style={styles.tipText}>• Try different angles for the same shot</Text>
          <Text style={styles.tipText}>• Some obstacles have different bounce physics</Text>
        </View>
      </ScrollView>
      
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => navigation.navigate('LevelSelect')}
        activeOpacity={0.7}
      >
        <FontAwesome5 name="play" size={20} color="#fff" />
        <Text style={styles.playButtonText}>Start Playing</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  stepContainer: {
    flexDirection: 'row',
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
  stepIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#fff8f6',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  tipContainer: {
    backgroundColor: '#fff8f6',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#f4511e',
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    lineHeight: 22,
  },
  playButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#f4511e',
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
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default TutorialScreen;
