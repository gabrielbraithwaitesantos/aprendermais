import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  Platform,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'outline';
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export const Button: React.FC<Props> = ({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
  contentStyle,
  textStyle,
}) => {
  const isDisabled = disabled || loading;
  const useWebPrimaryFallback = Platform.OS === 'web';

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.outlineButton,
          isDisabled && styles.buttonDisabled,
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={[styles.outlineButtonText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.ghostButton, isDisabled && styles.buttonDisabled, style]}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        {loading ? (
          <ActivityIndicator color="#334155" />
        ) : (
          <Text style={[styles.ghostButtonText, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.primaryButton, isDisabled && styles.buttonDisabled, style]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {useWebPrimaryFallback ? (
        <View style={[styles.webPrimaryContent, contentStyle]}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={[styles.primaryButtonText, textStyle]}>{title}</Text>
          )}
        </View>
      ) : (
        <LinearGradient
          colors={['#4F46E5', '#8B5CF6']}
          style={[styles.gradient, contentStyle]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={[styles.primaryButtonText, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

const isWeb = Platform.OS === 'web';
const buttonShadow = isWeb
  ? ({ boxShadow: '0 18px 32px rgba(79,70,229,0.35)' } as ViewStyle)
  : ({
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    } as ViewStyle);

const styles = StyleSheet.create({
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...buttonShadow,
  },
  gradient: {
    paddingVertical: 15,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  webPrimaryContent: {
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  ghostButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  ghostButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  outlineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
