import { useEffect, useRef } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export const useSignalRConnection = (livestreamId, apiBaseUrl = '') => {
  const connRef = useRef(null);

  useEffect(() => {
    if (!livestreamId) return;

    const conn = new HubConnectionBuilder()
      .withUrl(`${apiBaseUrl.replace(/\/$/, '')}/hubs/livestream`)
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    conn.start()
      .then(() => {
        conn.invoke('JoinGroup', livestreamId).catch((err) => {
          console.warn('Failed to join group', err);
        });
      })
      .catch((err) => {
        console.warn('Failed to start connection', err);
      });

    connRef.current = conn;

    return () => {
      if (connRef.current) {
        conn.invoke('LeaveGroup', livestreamId).catch((err) => {
          console.warn('Failed to leave group', err);
        });
        connRef.current.stop();
      }
    };
  }, [livestreamId, apiBaseUrl]);

  return connRef;
};
