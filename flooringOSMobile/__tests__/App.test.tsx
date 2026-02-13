/**
 * @format
 */

import { render } from '@testing-library/react-native';
import React from 'react';
import App from '../App';

test('renders correctly', () => {
  const { toJSON } = render(<App />);
  expect(toJSON()).toBeDefined();
});
