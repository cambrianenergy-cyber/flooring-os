import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ManualMeasureMode from './screens/ManualMeasureMode';
import LeicaDeviceProfile from './screens/LeicaDeviceProfile';
import LeicaBLEConnect from './screens/LeicaBLEConnect';
import WallCaptureUX from './screens/WallCaptureUX';
import { Button } from 'react-native';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="ManualMeasureMode">
        <Stack.Screen 
          name="ManualMeasureMode" 
          component={ManualMeasureMode} 
          options={({ navigation }) => ({
            title: 'Manual Measure',
            headerRight: () => (
              <Button title="Leica" onPress={() => navigation.navigate('LeicaDeviceProfile')} />
            ),
          })}
        />
        <Stack.Screen 
          name="LeicaDeviceProfile" 
          component={LeicaDeviceProfile} 
          options={({ navigation }) => ({
            title: 'Leica Device',
            headerRight: () => (
              <Button title="Connect" onPress={() => navigation.navigate('LeicaBLEConnect')} />
            ),
          })}
        />
        <Stack.Screen 
          name="LeicaBLEConnect" 
          component={LeicaBLEConnect} 
          options={({ navigation }) => ({
            title: 'Leica BLE Connect',
            headerRight: () => (
              <Button title="Wall Capture" onPress={() => navigation.navigate('WallCaptureUX')} />
            ),
          })}
        />
        <Stack.Screen 
          name="WallCaptureUX" 
          component={WallCaptureUX} 
          options={{ title: 'Wall Capture' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
