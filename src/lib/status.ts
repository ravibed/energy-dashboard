import type { Device, DeviceStatus } from '../types';

export const OFFLINE_AFTER_MS = 15 * 60 * 1000;

/** Fault if fault flag; else Offline if last seen > 15 min ago; else Online. */
export function getStatus(device: Pick<Device, 'fault' | 'lastSeen'>, nowMs: number = Date.now()): DeviceStatus {
  if (device.fault) return 'fault';
  if (nowMs - new Date(device.lastSeen).getTime() > OFFLINE_AFTER_MS) return 'offline';
  return 'online';
}
