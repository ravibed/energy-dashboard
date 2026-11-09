import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import devicesReducer from './devicesSlice';
import readingsReducer from './readingsSlice';
import themeReducer from './themeSlice';

export const makeStore = () => configureStore({ reducer: { devices: devicesReducer, readings: readingsReducer, theme: themeReducer } });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
