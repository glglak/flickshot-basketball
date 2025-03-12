import React from 'react';
import { View } from 'react-native';

const Floor = (props) => {
  const { body, color } = props;
  const { position, bounds } = body;
  
  const width = bounds.max.x - bounds.min.x;
  const height = bounds.max.y - bounds.min.y;
  
  const x = position.x - width / 2;
  const y = position.y - height / 2;
  
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        backgroundColor: color || '#222',
      }}
    />
  );
};

export default Floor;
