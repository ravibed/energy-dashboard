import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { makeStore } from '../store';
import { mockConfig } from '../api/mockApi';
import { THEME_STORAGE_KEY } from '../store/themeSlice';

const renderApp = () =>
  render(
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={['/devices']}>
        <App />
      </MemoryRouter>
    </Provider>,
  );

describe('theme switch', () => {
  beforeEach(() => {
    Object.assign(mockConfig, { minDelayMs: 0, maxDelayMs: 0, failureRate: 0 });
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('starts with "System" and no data-theme attribute', () => {
    renderApp();
    expect(screen.getByRole('button', { name: 'System theme' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('switches to dark and light, saves the choice, and back to system removes it', async () => {
    renderApp();

    await userEvent.click(screen.getByRole('button', { name: 'Dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Light theme' }));
    expect(document.documentElement.dataset.theme).toBe('light');

    await userEvent.click(screen.getByRole('button', { name: 'System theme' }));
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });

  it('remembers the saved choice after a reload (a new store)', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    renderApp();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('ignores a broken stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    renderApp();
    expect(screen.getByRole('button', { name: 'System theme' })).toHaveAttribute('aria-pressed', 'true');
  });
});
