import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { makeStore } from './store';
import { mockConfig } from './api/mockApi';

// Real store, real mock API (no failures), real chart: dashboard -> device -> back must work.
describe('whole app flow', () => {
  beforeEach(() => {
    Object.assign(mockConfig, { minDelayMs: 0, maxDelayMs: 0, failureRate: 0 });
    vi.spyOn(console, 'error').mockImplementation(() => {}); // ECharts warns about 0 size in jsdom
  });
  afterEach(() => vi.restoreAllMocks());

  it('opens a device, shows its data, and comes back to a working dashboard', async () => {
    render(
      <Provider store={makeStore()}>
        <MemoryRouter initialEntries={['/devices']}>
          <App />
        </MemoryRouter>
      </Provider>,
    );

    await userEvent.click(await screen.findByRole('link', { name: 'Inverter Roof North' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Inverter Roof North' })).toBeInTheDocument();
    expect(await screen.findByText(/intervals received/i)).toBeInTheDocument();
    expect(screen.queryByText(/could not be displayed/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: /all devices/i }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Devices' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Battery Storage 1' })).toBeInTheDocument();
  });
});
