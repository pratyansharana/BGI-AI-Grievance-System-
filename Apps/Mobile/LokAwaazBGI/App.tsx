import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { useEffect } from 'react';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

export default function App() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    const checkAndRequestPermissions = async () => {
      // 1. Check & Request Camera Permission
      if (!cameraPermission || !cameraPermission.granted) {
        await requestCameraPermission();
      }

      // 2. Check & Request Foreground Location Permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        console.log('Location permission not granted');
      }
    };

    checkAndRequestPermissions();
  }, []);

  return (
    <NavigationContainer>
      <AppNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});