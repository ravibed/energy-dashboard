export const formatKw = (watts: number): string => `${(watts / 1000).toFixed(1)} kW`;
export const formatKwh = (kwh: number): string => `${kwh.toFixed(2)} kWh`;
