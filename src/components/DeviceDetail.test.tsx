import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { makeStore } from '../store';
import { DeviceDetail } from './DeviceDetail';
import * as api from '../api/mockApi';

vi.mock('../api/mockApi', () => ({ getDevices: vi.fn(), getReadings: vi.fn() }));
vi.mock('./PowerChart', () => ({ PowerChart: () => <div data-testid="chart" /> }));

const renderPage = () =>
  render(
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={['/devices/inv-01']}>
        <Routes>
          <Route path="/devices/:id" element={<DeviceDetail />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

describe('DeviceDetail', () => {
  it('shows an error with a Retry button, and loads the data after retry', async () => {
    vi.mocked(api.getDevices).mockResolvedValue([]);
    vi.mocked(api.getReadings)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ deviceId: 'inv-01', intervalSeconds: 300, readings: [] });

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('boom');
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByTestId('chart')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/intervals received/i)).toBeInTheDocument();
    expect(api.getReadings).toHaveBeenCalledTimes(2);
  });
});
