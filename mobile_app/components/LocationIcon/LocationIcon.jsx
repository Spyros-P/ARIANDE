import React from 'react';
import { View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { s } from './LocationIcon.style.js'

export function LocationIcon({ size, color }){
  return (
    <View style={[s.root, {height:size, width:size}]}>
      <FontAwesome name="circle" size={size} color={color} style={[s.circle, { width: size, height: size }]}  />
      <FontAwesome name="location-arrow" size={size} color="white" style={s.arrow} />
    </View>
  );
};