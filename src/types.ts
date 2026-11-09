export type DeviceType = 'inverter' | 'battery';
export type DeviceStatus = 'online' | 'offline' | 'fault';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  currentPowerW: number;
  lastSeen: string; // ISO 8601 UTC
  fault: boolean;
}

export interface Reading {
  timestamp: string; // ISO 8601 UTC, END of the interval
  powerW: number; // average power over the interval; + delivered, - consumed
}

export interface ReadingsResponse {
  deviceId: string;
  intervalSeconds: number;
  readings: Reading[];
}
