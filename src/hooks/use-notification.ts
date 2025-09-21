"use client";

import { useCallback, useEffect, useState } from 'react';

export function useNotification() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if notifications are supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [supported]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!supported || permission !== 'granted') return null;

    try {
      const notification = new Notification(title, {
        icon: '/modetimer-logo_512x512.png',
        badge: '/modetimer-logo_512x512.png',
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return null;
    }
  }, [supported, permission]);

  const checkAndRequest = useCallback(async () => {
    if (!supported) return false;
    
    if (permission === 'granted') return true;
    if (permission === 'default') {
      return await requestPermission();
    }
    return false;
  }, [supported, permission, requestPermission]);

  return {
    supported,
    permission,
    requestPermission,
    sendNotification,
    checkAndRequest,
  } as const;
}