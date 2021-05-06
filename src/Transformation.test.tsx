import React from 'react';
import { render, screen } from '@testing-library/react';
import Transformation from './Transformation';

test('renders transform!', () => {
  render(<Transformation />);
  const transform = screen.getByText(/transform!/i);
  expect(transform).toBeInTheDocument();
});
