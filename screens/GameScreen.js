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
  
  const gameEngineRef = useRef(null);
  const ballPositionRef = useRef({ x: width * 0.2, y: height - FLOOR_HEIGHT - BALL_RADIUS });
  
  // Sound effects
  const playShootSound = async () => {
    if (!soundEnabled) return;
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/button_click.mp3') // Replace with actual shoot sound
      );
      await sound.playAsync();
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
    world.gravity.y = levelConfig.gravity.y;
    
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
      }
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
    Matter.Composite.add(world, [ball, floor, hoopSensor]);
    
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
            restitution: obstacle.restitution || 0.1,
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
    onPanResponderGrant: () => {
      setIsAiming(true);
      setTrajectoryPoints([]);
      setShowTutorial(false);
    },
    onPanResponderMove: (_, gesture) => {
      const { dx, dy } = gesture;
      
      // Calculate trajectory points for visual feedback
      calculateTrajectoryPoints(dx, dy);
    },
    onPanResponderRelease: (_, gesture) => {
      const { dx, dy } = gesture;
      
      // Only shoot if we've dragged enough
      if (Math.sqrt(dx * dx + dy * dy) > 20) {
        shootBall(dx, dy);
      }
      
      setIsAiming(false);
      setTrajectoryPoints([]);
    }
  });
  
  // Helper function to calculate trajectory points - FIXED
  const calculateTrajectoryPoints = (dx, dy) => {
    // Generate an array of points to show the predicted trajectory
    const points = [];
    
    // Invert dx and dy for more intuitive controls
    // This makes the ball go in the opposite direction of the swipe
    const invertedDx = -dx;
    const invertedDy = -dy;
    
    // Calculate force based on swipe distance
    const force = { 
      x: invertedDx / 15, 
      y: invertedDy / 15 
    };
    
    // Get the ball's starting position
    const startPos = { ...ballPositionRef.current };
    
    // Reduced gravity factor for better trajectory visualization
    const gravityFactor = 0.03;
    
    // Generate points along the predicted trajectory
    for (let i = 0; i < 15; i++) {
      const step = i * 5;
      points.push({
        x: startPos.x + (force.x * step),
        y: startPos.y + (force.y * step) + (0.5 * gravityFactor * step * step)
      });
    }
    
    setTrajectoryPoints(points);
  };
  
  // Helper function for shooting the ball - FIXED
  const shootBall = (dx, dy) => {
    if (!entities || shotsRemaining <= 0) return;
    
    // Play sound
    playShootSound();
    
    // Make the ball dynamic and apply force
    const ball = entities.ball.body;
    Matter.Body.setStatic(ball, false);
    
    // Invert dx and dy for more intuitive controls
    const invertedDx = -dx;
    const invertedDy = -dy;
    
    // Calculate force magnitude based on swipe distance
    // Capped to prevent extremely powerful shots
    const forceMagnitude = Math.min(Math.sqrt(invertedDx * invertedDx + invertedDy * invertedDy) / 8, 25);
    
    // Calculate force angle
    const forceAngle = Math.atan2(invertedDy, invertedDx);
    
    // Apply force to the ball
    Matter.Body.applyForce(ball, ball.position, {
      x: forceMagnitude * Math.cos(forceAngle),
      y: forceMagnitude * Math.sin(forceAngle)
    });
    
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
            { left: point.x - 2, top: point.y - 2 }
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
    backgroundColor: 'rgba(255, 140, 0, 0.5)',
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
