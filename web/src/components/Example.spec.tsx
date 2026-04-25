import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Example } from './Example';

describe('Example Component', () => {
  it('renders the title correctly', () => {
    render(<Example />);
    expect(screen.getByText('Estokar Web')).toBeInTheDocument();
  });

  it('renders the description correctly', () => {
    render(<Example />);
    expect(screen.getByText('Gerenciamento de estoque simplificado.')).toBeInTheDocument();
  });
});
