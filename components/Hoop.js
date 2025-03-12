import React from 'react';
import { View, StyleSheet } from 'react-native';

const Hoop = (props) => {
  const { position, size } = props;
  
  // Hoop board width and height
  const boardWidth = size.width;
  const boardHeight = size.height;
  
  // Hoop rim dimensions
  const rimWidth = boardWidth * 0.6;
  const rimHeight = 8;
  const netHeight = boardHeight * 0.8;
  
  // Calculate position with offset
  const x = position.x - boardWidth / 2;
  const y = position.y - boardHeight / 2;
  
  // Calculate rim position
  const rimX = position.x - rimWidth / 2;
  const rimY = position.y + boardHeight * 0.25;
  
  return (
    <View style={styles.container}>
      {/* Backboard */}
      <View
        style={[
          styles.backboard,
          {
            left: x,
            top: y,
            width: boardWidth,
            height: boardHeight,
          }
        ]}
      >
        <View style={styles.boardTarget} />
      </View>
      
      {/* Rim */}
      <View
        style={[
          styles.rim,
          {
            left: rimX,
            top: rimY,
            width: rimWidth,
            height: rimHeight,
          }
        ]}
      />
      
      {/* Net - simplified as vertical lines */}
      <View
        style={[
          styles.netContainer,
          {
            left: rimX,
            top: rimY + rimHeight - 1,
            width: rimWidth,
            height: netHeight,
          }
        ]}
      >
        {[...Array(8)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.netLine,
              {
                left: (rimWidth / 7) * index,
                height: netHeight,
              }
            ]}
          />
        ))}
        {[...Array(5)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.netHorizontalLine,
              {
                top: (netHeight / 4) * index + 5,
                width: rimWidth,
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backboard: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardTarget: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 20,
  },
  rim: {
    position: 'absolute',
    backgroundColor: '#FF4500',
    borderWidth: 1,
    borderColor: '#000000',
  },
  netContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  netLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: '#CCCCCC',
    top: 0,
  },
  netHorizontalLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#CCCCCC',
    left: 0,
  },
});

export default Hoop;
