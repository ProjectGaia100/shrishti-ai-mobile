// ─── Loading Skeleton ────────────────────────────────────────────────────────
// Displays animated shimmer placeholders while weather data loads
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { radius, opacity } from '../constants/DesignTokens';

const { width } = Dimensions.get('window');

function ShimmerBlock({ w, h, style }: { w: number | string; h: number; style?: any }) {
  const translateX = useRef(new Animated.Value(-width)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: width,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  const blockWidth = typeof w === 'number' ? w : width * (parseFloat(w as string) / 100);

  return (
    <View
      style={[
        {
          width: w as any,
          height: h,
          borderRadius: radius.md,
          backgroundColor: `rgba(255, 255, 255, ${opacity[10]})`,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[
            'transparent',
            `rgba(255, 255, 255, ${opacity[20]})`,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: blockWidth, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}

export default function LoadingSkeleton() {
  return (
    <View style={styles.container}>
      {/* City name */}
      <View style={styles.center}>
        <ShimmerBlock w={140} h={24} style={{ marginBottom: 20 }} />
      </View>

      {/* Temperature */}
      <View style={styles.center}>
        <ShimmerBlock w={180} h={90} style={{ marginBottom: 10 }} />
        <ShimmerBlock w={120} h={20} style={{ marginBottom: 6 }} />
        <ShimmerBlock w={180} h={16} style={{ marginBottom: 30 }} />
      </View>

      {/* Hourly section */}
      <ShimmerBlock w={'90%' as any} h={140} style={{ alignSelf: 'center', marginBottom: 16 }} />

      {/* Daily section */}
      <ShimmerBlock w={'90%' as any} h={250} style={{ alignSelf: 'center', marginBottom: 16 }} />

      {/* Details grid (6 cards) */}
      <View style={styles.gridRow}>
        <ShimmerBlock w={'45%'} h={130} />
        <ShimmerBlock w={'45%'} h={130} />
      </View>
      <View style={[styles.gridRow, { marginTop: 12 }]}>
        <ShimmerBlock w={'45%'} h={130} />
        <ShimmerBlock w={'45%'} h={130} />
      </View>
      <View style={[styles.gridRow, { marginTop: 12 }]}>
        <ShimmerBlock w={'45%'} h={130} />
        <ShimmerBlock w={'45%'} h={130} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  center: {
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
});
