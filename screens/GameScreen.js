import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import { FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Matter from 'matter-js';
import { GameContext } from '../App';

import Basketball from '../components/Basketball';
import Hoop from '../components/Hoop';
import Floor from '../components/Floor';
import { generateLevel, getLevelTutorial } from '../utils/levelGenerator';

const { width, height } = Dimensions.get('window');

// Physics variables
const BALL_SIZE = 40;
const BALL_RADIUS = BALL_SIZE / 2;
const FLOOR_HEIGHT = 50;

// Super-simplified physics system
const CustomPhysics = (entities, { time, dispatch }) => {
  if (!entities.ball) return entities;
  
  const ball = entities.ball;
  
  // If ball is static, don't apply physics
  if (ball.isStatic) return entities;
  
  // Get current position
  const pos = { x: ball.x, y: ball.y };
  const vel = { x: ball.vx, y: ball.vy };
  
  // Apply gravity
  vel.y += 0.5; // Stronger gravity
  
  // Update position based on velocity
  pos.x += vel.x;
  pos.y += vel.y;
  
  // Check for floor collision
  const floorY = height - FLOOR_HEIGHT - BALL_RADIUS;
  if (pos.y > floorY && vel.y > 0) {
    // Hit the floor, bounce!
    console.log("FLOOR COLLISION DETECTED - MANUAL BOUNCE");
    
    // Bounce with damping factor
    vel.y = -vel.y * 0.7; // Bounce is 70% of incoming velocity
    
    // Ensure the ball is above the floor
    pos.y = floorY;
    
    // Slow down horizontal movement due to friction
    vel.x *= 0.9;
    
    // Track bounce
    ball.bounceCount = (ball.bounceCount || 0) + 1;
    console.log(`Bounce #${ball.bounceCount}, velocity: ${vel.y}`);
    
    // Dispatch bounce event
    if (dispatch) {
      dispatch({ type: 'ball-bounce' });
    }
    
    // If bounce is very small, stop the ball
    if (Math.abs(vel.y) < 2) {
      console.log("Ball stopped due to low bounce");
      ball.isStatic = true;
      return entities;
    }
  }
  
  // Check wall collisions
  // Left wall
  if (pos.x < BALL_RADIUS) {
    pos.x = BALL_RADIUS;
    vel.x = -vel.x * 0.7;
  }
  // Right wall
  if (pos.x > width - BALL_RADIUS) {
    pos.x = width - BALL_RADIUS;
    vel.x = -vel.x * 0.7;
  }
  // Ceiling
  if (pos.y < BALL_RADIUS) {
    pos.y = BALL_RADIUS;
    vel.y = -vel.y * 0.7;
  }
  
  // Check if ball is off-screen
  if (pos.y > height + 100 || pos.x < -100 || pos.x > width + 100) {
    console.log("Ball off-screen - resetting");
    resetBall(entities);
    if (dispatch) {
      dispatch({ type: 'ball-reset' });
    }
    return entities;
  }
  
  // Update ball state
  ball.x = pos.x;
  ball.y = pos.y;
  ball.vx = vel.x;
  ball.vy = vel.y;
  ball.rotation += vel.x * 0.05; // Add some rotation based on horizontal movement
  
  return entities;
};

// Helper function to reset ball
const resetBall = (entities) => {
  // Update ball state
  entities.ball.x = width * 0.2;
  entities.ball.y = height - FLOOR_HEIGHT - BALL_RADIUS;
  entities.ball.vx = 0;
  entities.ball.vy = 0;
  entities.ball.rotation = 0;
  entities.ball.isStatic = true;
  entities.ball.bounceCount = 0;
  
  return entities;
};

// Ball renderer component - extremely simplified
const SimpleBall = (props) => {
  const { x, y, size, rotation } = props;
  
  return (
    <View
      style={[
        styles.ball,
        {
          left: x - size/2,
          top: y - size/2,
          width: size,
          height: size,
          borderRadius: size/2,
          transform: [{ rotate: `${rotation}rad` }]
        }
      ]}
    >
      <View style={styles.ballInner}>
        <View style={styles.ballLine} />
      </View>
    </View>
  );
};

// Simplified floor renderer
const SimpleFloor = (props) => {
  return (
    <View
      style={[
        styles.floor,
        {
          top: height - FLOOR_HEIGHT,
          height: FLOOR_HEIGHT
        }
      ]}
    />
  );
};

// Hoop renderer
const SimpleHoop = (props) => {
  const { position, size } = props;
  
  return (
    <View
      style={[
        styles.hoop,
        {
          left: position.x - size.width/2,
          top: position.y - size.height/2,
          width: size.width,
          height: size.height
        }
      ]}
    />
  );
};

const GameScreen = ({ route, navigation }) => {
  const { level = 1 } = route.params;
  const { soundEnabled } = useContext(GameContext);
  
  const [entities, setEntities] = useState(null);
  const [score, setScore] = useState(0);
  const [shotsRemaining, setShotsRemaining] = useState(5);
  const [isAiming, setIsAiming] = useState(false);
  const [trajectoryPoints, setTrajectoryPoints] = useState([]);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialText, setTutorialText] = useState('');
  const [debugInfo, setDebugInfo] = useState({bounces: 0});
  
  // Store aim coordinates
  const [aimCoordinates, setAimCoordinates] = useState({ startX: 0, startY: 0, currentX: 0, currentY: 0 });
  
  const gameEngineRef = useRef(null);
  const soundRef = useRef(null);
  
  // Sound effects
  const setupSound = async () => {
    if (!soundEnabled) return;
    
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/button_click.mp3')
      );
      
      soundRef.current = sound;
    } catch (error) {
      console.log('Error setting up sound:', error);
    }
  };
  
  // Play sound
  const playShootSound = async () => {
    if (!soundEnabled || !soundRef.current) return;
    
    try {
      await soundRef.current.setPositionAsync(0);
      await soundRef.current.playAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
      setupSound();
    }
  };
  
  // Handle game events
  const onEvent = (e) => {
    if (e.type === 'ball-bounce') {
      setDebugInfo(prev => ({...prev, bounces: prev.bounces + 1}));
    } else if (e.type === 'ball-reset') {
      setDebugInfo(prev => ({...prev, bounces: 0}));
    }
  };
  
  // Set up sound
  useEffect(() => {
    setupSound();
    
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [soundEnabled]);
  
  // Initialize entities
  useEffect(() => {
    setTutorialText(getLevelTutorial(level));
    
    // Load level configuration
    const levelConfig = generateLevel(level);
    const hoopPosition = levelConfig.hoopPosition;
    const hoopSize = { width: 100, height: 70 };
    
    // Create entities with super simplified physics
    const initialEntities = {
      floor: {
        renderer: SimpleFloor
      },
      ball: {
        x: width * 0.2,
        y: height - FLOOR_HEIGHT - BALL_RADIUS,
        size: BALL_SIZE,
        vx: 0,
        vy: 0,
        rotation: 0,
        isStatic: true,
        bounceCount: 0,
        renderer: SimpleBall
      },
      hoop: {
        position: hoopPosition,
        size: hoopSize,
        renderer: SimpleHoop
      }
    };
    
    setEntities(initialEntities);
  }, [level]);
  
  // Pan responder for shooting
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setIsAiming(true);
      setTrajectoryPoints([]);
      setShowTutorial(false);
      
      setAimCoordinates({
        startX: locationX,
        startY: locationY,
        currentX: locationX,
        currentY: locationY
      });
    },
    onPanResponderMove: (evt, gesture) => {
      const { locationX, locationY } = evt.nativeEvent;
      
      setAimCoordinates(prev => ({
        ...prev,
        currentX: locationX,
        currentY: locationY
      }));
      
      calculateTrajectory(locationX, locationY);
    },
    onPanResponderRelease: (evt, gesture) => {
      const { startX, startY, currentX, currentY } = aimCoordinates;
      
      const dx = currentX - startX;
      const dy = currentY - startY;
      
      const dragDistance = Math.sqrt(dx * dx + dy * dy);
      if (dragDistance > 20) {
        shootBall(dx, dy);
      }
      
      setIsAiming(false);
      setTrajectoryPoints([]);
    }
  });
  
  // Calculate trajectory
  const calculateTrajectory = (currentX, currentY) => {
    if (!aimCoordinates.startX) return;
    
    const dx = currentX - aimCoordinates.startX;
    const dy = currentY - aimCoordinates.startY;
    
    const dragDistance = Math.sqrt(dx * dx + dy * dy);
    if (dragDistance < 10) return;
    
    const points = [];
    
    // Ball starting position
    const ballX = width * 0.2;
    const ballY = height - FLOOR_HEIGHT - BALL_RADIUS;
    
    // Force vector (opposite to drag direction)
    const forceScale = 0.5; // Much higher for visibility
    const forceX = -dx * forceScale;
    const forceY = -dy * forceScale;
    
    // Simple projectile simulation
    const timeStep = 0.1;
    const gravity = 0.5;
    
    let vx = forceX;
    let vy = forceY;
    let x = ballX;
    let y = ballY;
    
    // Generate trajectory points
    for (let i = 0; i < 20; i++) {
      points.push({ x, y });
      
      x += vx * timeStep;
      y += vy * timeStep;
      
      vy += gravity * timeStep;
    }
    
    setTrajectoryPoints(points);
  };
  
  // Shoot the ball
  const shootBall = (dx, dy) => {
    if (!entities || !entities.ball || shotsRemaining <= 0) return;
    
    playShootSound();
    
    // Calculate force
    const dragDistance = Math.sqrt(dx * dx + dy * dy);
    const forceMagnitude = Math.min(dragDistance * 0.03, 15); // Much higher values for simplified physics
    
    // Update ball state
    entities.ball.isStatic = false;
    entities.ball.vx = -dx * forceMagnitude * 0.015;
    entities.ball.vy = -dy * forceMagnitude * 0.015;
    
    console.log('Shot velocity set:', {
      x: entities.ball.vx,
      y: entities.ball.vy,
      dragDistance
    });
    
    // Reset bounce count
    setDebugInfo({bounces: 0});
    
    // Decrement shots
    setShotsRemaining(prevShots => prevShots - 1);
  };
  
  // Helper function to reset
  const resetBallState = () => {
    if (gameEngineRef.current && gameEngineRef.current.entities) {
      resetBall(gameEngineRef.current.entities);
    }
    setDebugInfo({bounces: 0});
  };
  
  // Score calculation
  const calculateShotScore = () => {
    return 100 + (shotsRemaining * 20) + (level * 10);
  };
  
  // Handle pause
  const handlePausePress = () => {
    navigation.navigate('LevelSelect');
  };
  
  // Handle restart
  const handleRestartPress = () => {
    resetBallState();
    setScore(0);
    setShotsRemaining(5);
  };
  
  // Debug mode
  const toggleDebugMode = () => {
    Alert.alert('Debug Info', `Bounce count: ${debugInfo.bounces}\nShots remaining: ${shotsRemaining}`);
  };
  
  if (!entities) return null;
  
  return (
    <View style={styles.container}>
      <GameEngine
        ref={gameEngineRef}
        style={styles.gameEngine}
        systems={[CustomPhysics]}
        entities={entities}
        running={true}
        onEvent={onEvent}
      />
      
      {/* Trajectory visualization */}
      {isAiming && trajectoryPoints.map((point, index) => (
        <View 
          key={index}
          style={[
            styles.trajectoryPoint,
            { 
              left: point.x - 2, 
              top: point.y - 2,
              opacity: 1 - (index / trajectoryPoints.length)
            }
          ]}
        />
      ))}
      
      {/* Game UI */}
      <View style={styles.uiContainer} {...panResponder.panHandlers}>
        {/* Header with level, score and shots remaining */}
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleDebugMode} style={styles.levelContainer}>
            <Text style={styles.levelText}>Level {level}</Text>
          </TouchableOpacity>
          
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>Score: {score}</Text>
          </View>
          
          <View style={styles.shotsContainer}>
            <Text style={styles.shotsText}>Shots: {shotsRemaining}</Text>
          </View>
        </View>
        
        {/* Tutorial message */}
        {showTutorial && (
          <View style={styles.tutorialContainer}>
            <Text style={styles.tutorialText}>{tutorialText}</Text>
          </View>
        )}
        
        {/* Game controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handlePausePress}
          >
            <FontAwesome5 name="pause" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleRestartPress}
          >
            <FontAwesome5 name="redo" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  gameEngine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ball: {
    position: 'absolute',
    backgroundColor: '#FF8C00',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  ballInner: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballLine: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  floor: {
    position: 'absolute',
    width: '100%',
    backgroundColor: '#333',
    left: 0,
  },
  hoop: {
    position: 'absolute',
    backgroundColor: 'red',
    borderRadius: 5,
  },
  trajectoryPoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 140, 0, 0.8)',
  },
  uiContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  levelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scoreContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  scoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  shotsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  shotsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tutorialContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginHorizontal: 20,
  },
  tutorialText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default GameScreen;