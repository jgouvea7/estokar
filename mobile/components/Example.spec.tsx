import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Example } from './Example';

describe('Example Mobile Component', () => {
  it('renders the title correctly', () => {
    render(<Example />);
    expect(screen.getByText('Estokar Mobile')).toBeTruthy();
  });

  it('renders the description correctly', () => {
    render(<Example />);
    expect(screen.getByText('Controle seu estoque de qualquer lugar.')).toBeTruthy();
  });
});
