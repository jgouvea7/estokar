import { useUIStore } from '@/store/ui-store';

beforeEach(() => {
  useUIStore.setState({ isDesktopCollapsed: false });
});

describe('ui-store', () => {
  it('should start with collapsed false', () => {
    const state = useUIStore.getState();
    expect(state.isDesktopCollapsed).toBe(false);
  });

  it('should toggle collapsed', () => {
    useUIStore.getState().toggleDesktopCollapsed();
    expect(useUIStore.getState().isDesktopCollapsed).toBe(true);
    useUIStore.getState().toggleDesktopCollapsed();
    expect(useUIStore.getState().isDesktopCollapsed).toBe(false);
  });

  it('should set collapsed value', () => {
    useUIStore.getState().setDesktopCollapsed(true);
    expect(useUIStore.getState().isDesktopCollapsed).toBe(true);
    useUIStore.getState().setDesktopCollapsed(false);
    expect(useUIStore.getState().isDesktopCollapsed).toBe(false);
  });
});
