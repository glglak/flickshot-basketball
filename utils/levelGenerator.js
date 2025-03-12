import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Generates level configuration based on level number
 * @param {number} level - Current level number
 * @returns {Object} Level configuration including hoop position and obstacles
 */
export const generateLevel = (level) => {
  // Default configuration
  const config = {
    hoopPosition: { x: width * 0.8, y: height * 0.4 },
    gravity: { x: 0, y: 1 },
    wind: 0,
    obstacles: [],
  };
  
  // Adjust difficulty based on level
  switch (level) {
    case 1:
      // Tutorial level - no obstacles
      break;
      
    case 2:
      // Simple obstacle
      config.obstacles.push({
        x: width * 0.5,
        y: height * 0.6,
        width: width * 0.08,
        height: height * 0.2,
        color: '#555',
      });
      break;
      
    case 3:
      // Moving hoop position higher
      config.hoopPosition = { x: width * 0.85, y: height * 0.3 };
      
      // Two obstacles
      config.obstacles.push({
        x: width * 0.4,
        y: height * 0.5,
        width: width * 0.08,
        height: height * 0.15,
        color: '#555',
      });
      
      config.obstacles.push({
        x: width * 0.6,
        y: height * 0.7,
        width: width * 0.12,
        height: height * 0.08,
        color: '#555',
      });
      break;
      
    case 4:
      // Slightly more complex setup
      config.hoopPosition = { x: width * 0.75, y: height * 0.35 };
      
      // Add some obstacles forming a challenging path
      config.obstacles.push({
        x: width * 0.35,
        y: height * 0.5,
        width: width * 0.05,
        height: height * 0.3,
        color: '#555',
      });
      
      config.obstacles.push({
        x: width * 0.6,
        y: height * 0.4,
        width: width * 0.1,
        height: height * 0.05,
        color: '#555',
      });
      
      config.obstacles.push({
        x: width * 0.6,
        y: height * 0.7,
        width: width * 0.3,
        height: height * 0.05,
        color: '#555',
      });
      break;
      
    case 5:
      // More challenging setup
      config.hoopPosition = { x: width * 0.8, y: height * 0.25 };
      
      // Obstacle maze
      config.obstacles.push({
        x: width * 0.4,
        y: height * 0.4,
        width: width * 0.06,
        height: height * 0.4,
        color: '#555',
      });
      
      config.obstacles.push({
        x: width * 0.6,
        y: height * 0.35,
        width: width * 0.06,
        height: height * 0.4,
        color: '#555',
      });
      
      // Ceiling obstacle
      config.obstacles.push({
        x: width * 0.5,
        y: height * 0.15,
        width: width * 0.5,
        height: height * 0.05,
        color: '#555',
      });
      break;
      
    default:
      // For levels beyond 5, start introducing random elements
      if (level > 5) {
        // Adjust hoop position to be more challenging
        const hoopX = Math.min(width * 0.9, width * (0.7 + Math.random() * 0.2));
        const hoopY = Math.max(height * 0.2, height * (0.4 - (level - 5) * 0.03));
        
        config.hoopPosition = { x: hoopX, y: hoopY };
        
        // Add between 2 to 5 obstacles depending on level
        const numObstacles = Math.min(2 + Math.floor((level - 5) / 2), 7);
        
        for (let i = 0; i < numObstacles; i++) {
          // Create obstacles at various positions, avoiding direct path
          const isVertical = Math.random() > 0.5;
          
          const obstacleWidth = isVertical 
            ? width * (0.05 + Math.random() * 0.03) 
            : width * (0.1 + Math.random() * 0.2);
            
          const obstacleHeight = isVertical 
            ? height * (0.2 + Math.random() * 0.3) 
            : height * (0.05 + Math.random() * 0.03);
            
          const obstacleX = width * (0.3 + Math.random() * 0.5);
          const obstacleY = height * (0.3 + Math.random() * 0.4);
          
          config.obstacles.push({
            x: obstacleX,
            y: obstacleY,
            width: obstacleWidth,
            height: obstacleHeight,
            color: '#555',
            // Add varying physical properties for advanced levels
            friction: 0.1 + Math.random() * 0.3,
            restitution: 0.1 + Math.random() * 0.4,
          });
        }
        
        // For very high levels, add environmental effects
        if (level > 8) {
          // Add wind effect (positive is right, negative is left)
          config.wind = (Math.random() * 2 - 1) * (level - 8) * 0.01;
          
          // Slightly modify gravity for extra challenge
          const gravityMod = 1 + ((level - 8) * 0.05);
          config.gravity = { x: 0, y: gravityMod };
        }
      }
      break;
  }
  
  return config;
};

/**
 * Generates a tutorial text based on level number
 * @param {number} level - Current level number
 * @returns {string} Tutorial text for the level
 */
export const getLevelTutorial = (level) => {
  switch (level) {
    case 1:
      return "Swipe and release to shoot! Pull back to aim, the longer the swipe, the more power.";
    case 2:
      return "Watch out for obstacles. Try to find the right angle and power.";
    case 3:
      return "The hoop is higher now. You'll need more power to reach it!";
    case 4:
      return "Navigate through the obstacle maze. Timing and angle are key.";
    case 5:
      return "Things are getting tricky. Try bouncing off surfaces if needed.";
    default:
      if (level > 8) {
        return `Level ${level}: Environmental effects like wind are now active. Adjust your shot accordingly!`;
      }
      return `Level ${level}: Find your way through the obstacles to score!`;
  }
};
