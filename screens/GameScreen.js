import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, StyleSheet, Dimensions, PanResponder, Text, TouchableOpacity } from 'react-native';
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

// Physics configuration
const Physics = (entities, { time }) => {
  const engine = entities.physics.engine;
  Matter.Engine.update(engine, time.delta);
  
  // Check if ball has gone off-screen and reset if needed
  const ball = entities.ball.body;
  if (
    ball.position.y > height + 100 || 
    ball.position.y < -100 ||
    ball.position.x > width + 100 ||
    ball.position.x < -100
  ) {
    // Ball is off-screen, reset it
    Matter.Body.setPosition(ball, {
      x: width * 0.2,
      y: height - FLOOR_HEIGHT - BALL_RADIUS
    });
    Matter.Body.setVelocity(ball, { x: 0, y: 0 });
    Matter.Body.setStatic(ball, true);
  }
  
  // DEBUG: Log ball position and velocity occasionally to troubleshoot
  if (Math.random() < 0.01) {
    console.log('Ball position:', ball.position, 'velocity:', ball.velocity, 'isStatic:', ball.isStatic);
  }
  
  return entities;
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
  
  // Store aim coordinates
  const [aimCoordinates, setAimCoordinates] = useState({ startX: 0, startY: 0, currentX: 0, currentY: 0 });
  
  const gameEngineRef = useRef(null);
  const ballPositionRef = useRef({ x: width * 0.2, y: height - FLOOR_HEIGHT - BALL_RADIUS });
  
  // Sound effects
  const playShootSound = async () => {
    if (!soundEnabled) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/button_click.mp3'),
        { shouldPlay: true }
      );
      
      // Set up an error handler for the sound
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.error) {
          console.log('Sound error:', status.error);
        }
      });
      
      // Unload sound when finished to prevent memory leaks
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(e => console.log('Error unloading sound:', e));
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };
  
  // Initialize physics engine
  useEffect(() => {
    // Set tutorial text
    setTutorialText(getLevelTutorial(level));
    
    const engine = Matter.Engine.create({ enableSleeping: false });
    const world = engine.world;
    
    // Load level configuration
    const levelConfig = generateLevel(level);
    
    // Set world gravity
    world.gravity.x = levelConfig.gravity.x;
    world.gravity.y = levelConfig.gravity.y; // Restore normal gravity for better physics
    
    // Create ball
    const ball = Matter.Bodies.circle(
      ballPositionRef.current.x,
      ballPositionRef.current.y,
      BALL_RADIUS,
      { 
        restitution: 0.8, 
        friction: 0.05,
        frictionAir: 0.0005,
        label: 'ball',
        isStatic: true, // Ball is static until shot
        density: 0.001, // Lower density to make the ball lighter
      }
    );
    
    // Create floor
    const floor = Matter.Bodies.rectangle(
      width / 2,
      height - FLOOR_HEIGHT / 2,
      width,
      FLOOR_HEIGHT,
      { 
        isStatic: true,
        label: 'floor',
        restitution: 0.7, // Increased bounce for the floor
        friction: 0.1,    // Added some friction
      }
    );
    
    // Create invisible barrier 100px below the floor to catch balls
    const bottomBarrier = Matter.Bodies.rectangle(
      width / 2,
      height + 100,
      width * 2,
      20,
      { 
        isStatic: true,
        label: 'bottomBarrier',
        restitution: 0.5,
      }
    );
    
    // Create walls to prevent ball from leaving screen
    const leftWall = Matter.Bodies.rectangle(
      -10,
      height / 2,
      20,
      height * 2,
      { isStatic: true, label: 'wall', restitution: 0.5 }
    );
    
    const rightWall = Matter.Bodies.rectangle(
      width + 10,
      height / 2,
      20,
      height * 2,
      { isStatic: true, label: 'wall', restitution: 0.5 }
    );
    
    const ceiling = Matter.Bodies.rectangle(
      width / 2,
      -10,
      width * 2,
      20,
      { isStatic: true, label: 'ceiling', restitution: 0.5 }
    );
    
    // Create hoop
    const hoopPosition = levelConfig.hoopPosition;
    const hoopSize = { width: 100, height: 70 };
    
    const hoopSensor = Matter.Bodies.rectangle(
      hoopPosition.x,
      hoopPosition.y,
      hoopSize.width * 0.4,
      10,
      {
        isSensor: true,
        isStatic: true,
        label: 'hoopSensor',
      }
    );
    
    // Add all bodies to the world
    Matter.Composite.add(world, [ball, floor, leftWall, rightWall, ceiling, bottomBarrier, hoopSensor]);
    
    // Add any obstacles from level config
    if (levelConfig.obstacles) {
      levelConfig.obstacles.forEach(obstacle => {
        const obstacleBody = Matter.Bodies.rectangle(
          obstacle.x,
          obstacle.y,
          obstacle.width,
          obstacle.height,
          {
            isStatic: true,
            label: 'obstacle',
            friction: obstacle.friction || 0.1,
            restitution: obstacle.restitution || 0.3,
          }
        );
        Matter.Composite.add(world, obstacleBody);
      });
    }
    
    // Set up collision detection
    Matter.Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      
      pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        
        // Check if ball entered the hoop
        if (
          (bodyA.label === 'ball' && bodyB.label === 'hoopSensor') ||
          (bodyA.label === 'hoopSensor' && bodyB.label === 'ball')
        ) {
          // Scored a basket!
          setScore(prevScore => prevScore + calculateShotScore());
          
          // Check if level is complete
          if (shotsRemaining <= 1) {
            // Navigate to results screen after a short delay
            setTimeout(() => {
              navigation.replace('Result', {
                level,
                score: score + calculateShotScore(),
                isLevelCompleted: true,
              });
            }, 1000);
          } else {
            resetBall();
          }
        }
        
        // Check if ball hit the bottom barrier and reset
        if (
          (bodyA.label === 'ball' && bodyB.label === 'bottomBarrier') ||
          (bodyA.label === 'bottomBarrier' && bodyB.label === 'ball')
        ) {
          // Ball went too far down, reset it
          resetBall();
        }
        
        // Debug collision events
        console.log('Collision between', bodyA.label, 'and', bodyB.label);
      });
    });
    
    // Create initial entities
    const initialEntities = {
      physics: { engine, world },
      ball: { 
        body: ball, 
        size: BALL_SIZE, 
        color: 'orange', 
        renderer: Basketball 
      },
      floor: { 
        body: floor, 
        color: '#222', 
        renderer: Floor 
      },
      hoop: { 
        position: hoopPosition,
        size: hoopSize,
        sensor: hoopSensor,
        renderer: Hoop 
      },
    };
    
    // Add obstacles to entities
    if (levelConfig.obstacles) {
      levelConfig.obstacles.forEach((obstacle, index) => {
        initialEntities[`obstacle_${index}`] = {
          body: world.bodies.find(b => b.label === 'obstacle' && 
                               b.position.x === obstacle.x && 
                               b.position.y === obstacle.y),
          size: { width: obstacle.width, height: obstacle.height },
          color: obstacle.color || '#444',
          renderer: Floor // Reusing Floor component for obstacles
        };
      });
    }
    
    setEntities(initialEntities);
    
    // Clean up
    return () => {
      Matter.Engine.clear(engine);
    };
  }, [level]);
  
  // Pan responder for shooting the ball
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setIsAiming(true);
      setTrajectoryPoints([]);
      setShowTutorial(false);
      
      // Store the initial touch position
      setAimCoordinates({
        startX: locationX,
        startY: locationY,
        currentX: locationX,
        currentY: locationY
      });
    },
    onPanResponderMove: (evt, gesture) => {
      const { locationX, locationY } = evt.nativeEvent;
      
      // Update the current touch position
      setAimCoordinates(prev => ({
        ...prev,
        currentX: locationX,
        currentY: locationY
      }));
      
      // Calculate trajectory based on the current aiming vector
      calculateTrajectory(locationX, locationY);
    },
    onPanResponderRelease: (evt, gesture) => {
      const { startX, startY, currentX, currentY } = aimCoordinates;
      
      // Calculate the drag vector
      const dx = currentX - startX;
      const dy = currentY - startY;
      
      // Only shoot if the drag distance is significant
      const dragDistance = Math.sqrt(dx * dx + dy * dy);
      if (dragDistance > 20) {
        shootBall(dx, dy);
      }
      
      setIsAiming(false);
      setTrajectoryPoints([]);
    }
  });
  
  // Calculate trajectory based on aim coordinates
  const calculateTrajectory = (currentX, currentY) => {
    if (!aimCoordinates.startX) return;
    
    // Vector from current position to start position (drag direction)
    const dx = currentX - aimCoordinates.startX;
    const dy = currentY - aimCoordinates.startY;
    
    // Only calculate if there's enough drag distance
    const dragDistance = Math.sqrt(dx * dx + dy * dy);
    if (dragDistance < 10) return;
    
    // Prepare trajectory points array
    const points = [];
    
    // Ball starting position
    const ballX = ballPositionRef.current.x;
    const ballY = ballPositionRef.current.y;
    
    // Scale factor for force (can be adjusted to control sensitivity)
    const forceScale = 0.1;
    
    // Force vector (opposite to drag direction)
    const forceX = -dx * forceScale;
    const forceY = -dy * forceScale;
    
    // Simplified physics simulation to show trajectory
    // Time step
    const timeStep = 0.2;
    // Gravity
    const gravity = 0.1;
    
    let vx = forceX;
    let vy = forceY;
    let x = ballX;
    let y = ballY;
    
    // Generate trajectory points
    for (let i = 0; i < 20; i++) {
      // Add point
      points.push({ x, y });
      
      // Update position using velocity
      x += vx * timeStep;
      y += vy * timeStep;
      
      // Update velocity due to gravity
      vy += gravity * timeStep;
    }
    
    setTrajectoryPoints(points);
  };
  
  // Helper function for shooting the ball
  const shootBall = (dx, dy) => {
    if (!entities || shotsRemaining <= 0) return;
    
    // Play sound
    playShootSound();
    
    // Make the ball dynamic
    const ball = entities.ball.body;
    Matter.Body.setStatic(ball, false);
    
    // Calculate force magnitude (increased from original)
    const dragDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Apply force in the opposite direction of the drag (increased force magnitude)
    const forceMagnitude = Math.min(dragDistance * 0.003, 0.05); // Increased the force magnitude
    
    Matter.Body.applyForce(ball, ball.position, {
      x: -dx * forceMagnitude,
      y: -dy * forceMagnitude
    });
    
    console.log('Shot applied force:', {
      x: -dx * forceMagnitude,
      y: -dy * forceMagnitude
    });
    
    // Decrement shots remaining
    setShotsRemaining(prevShots => prevShots - 1);
  };
  
  // Helper function to reset the ball to starting position
  const resetBall = () => {
    const ball = entities.ball.body;
    Matter.Body.setPosition(ball, {
      x: ballPositionRef.current.x,
      y: ballPositionRef.current.y
    });
    Matter.Body.setVelocity(ball, { x: 0, y: 0 });
    Matter.Body.setStatic(ball, true);
  };
  
  // Helper function to calculate score based on shot difficulty
  const calculateShotScore = () => {
    // Base score
    let score = 100;
    
    // Add bonus for remaining shots
    score += shotsRemaining * 20;
    
    // Add bonus for level difficulty
    score += level * 10;
    
    return score;
  };
  
  // Handle pause button press
  const handlePausePress = () => {
    // Navigate to level select
    navigation.navigate('LevelSelect');
  };
  
  // Handle restart button press
  const handleRestartPress = () => {
    // Reset the game
    resetBall();
    setScore(0);
    setShotsRemaining(5);
  };
  
  if (!entities) return null;
  
  return (
    <View style={styles.container}>
      <GameEngine
        ref={gameEngineRef}
        style={styles.gameEngine}
        systems={[Physics]}
        entities={entities}
        running={true}
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
              opacity: 1 - (index / trajectoryPoints.length)  // Fade out dots further along trajectory
            }
          ]}
        />
      ))}
      
      {/* Game UI */}
      <View style={styles.uiContainer} {...panResponder.panHandlers}>
        {/* Header with level, score and shots remaining */}
        <View style={styles.header}>
          <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Level {level}</Text>
          </View>
          
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