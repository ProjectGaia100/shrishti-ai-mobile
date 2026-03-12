// ─── Touchable Component ─────────────────────────────────────────────────────
// Touchable with scale animation and haptic feedback
import React, { useRef } from 'react';
import { TouchableOpacity, Animated, ViewStyle, TouchableOpacityProps } from 'react-native';
import { lightHaptic } from '../utils/haptics';

interface TouchableProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  haptic?: boolean;
  scaleValue?: number;
}

export default function Touchable({
  children,
  style,
  onPress,
  haptic = true,
  scaleValue = 0.96,
  activeOpacity = 0.8,
  ...props
}: TouchableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleValue,
      tension: 200,
      friction: 15,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 200,
      friction: 15,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (haptic) {
      lightHaptic();
    }
    onPress?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
