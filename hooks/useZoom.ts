
import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'verblume-zoom-level';
const DEFAULT_ZOOM = 100;
const MIN_ZOOM = 70;
const MAX_ZOOM = 150;
const ZOOM_STEP = 10;

const getStoredZoom = (): number => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const zoom = stored ? parseInt(stored, 10) : DEFAULT_ZOOM;
    if (!isNaN(zoom) && zoom >= MIN_ZOOM && zoom <= MAX_ZOOM) {
      return zoom;
    }
  } catch (error) {
    console.error("Failed to parse zoom level from localStorage", error);
  }
  return DEFAULT_ZOOM;
};

export const useZoom = (): [
  number,
  () => void,
  () => void,
  () => void
] => {
  const [zoomLevel, setZoomLevel] = useState<number>(getStoredZoom);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(zoomLevel));
    } catch (error) {
      console.error("Failed to save zoom level to localStorage", error);
    }
  }, [zoomLevel]);

  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  }, []);
  
  const resetZoom = useCallback(() => {
    setZoomLevel(DEFAULT_ZOOM);
  }, []);

  return [zoomLevel, zoomIn, zoomOut, resetZoom];
};
