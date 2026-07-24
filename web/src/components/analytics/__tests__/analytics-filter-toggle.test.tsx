import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalyticsFilterToggle } from '@/components/analytics/analytics-filter-toggle';

describe('AnalyticsFilterToggle', () => {
  const defaultProps = {
    selected: 'monthly' as const,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders 4 buttons', () => {
    render(<AnalyticsFilterToggle {...defaultProps} />);
    expect(screen.getByText('Diário')).toBeInTheDocument();
    expect(screen.getByText('Semanal')).toBeInTheDocument();
    expect(screen.getByText('Mensal')).toBeInTheDocument();
    expect(screen.getByText('Anual')).toBeInTheDocument();
  });

  it('calls onChange with correct value when button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<AnalyticsFilterToggle {...defaultProps} onChange={onChange} />);

    await user.click(screen.getByText('Semanal'));
    expect(onChange).toHaveBeenCalledWith('weekly');
  });

  it('does NOT deselect when clicking the already active button', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<AnalyticsFilterToggle {...defaultProps} selected="monthly" onChange={onChange} />);

    await user.click(screen.getByText('Mensal'));
    expect(onChange).toHaveBeenCalledWith('monthly');
    expect(onChange).not.toHaveBeenCalledWith(null);
  });

  it('active button has different styling than inactive buttons', () => {
    render(<AnalyticsFilterToggle {...defaultProps} />);
    const activeButton = screen.getByText('Mensal');
    const inactiveButton = screen.getByText('Semanal');
    expect(activeButton.className).toContain('bg-(--button)');
    expect(activeButton.className).toContain('text-white');
    expect(inactiveButton.className).not.toContain('bg-(--button)');
  });
});
