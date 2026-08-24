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
    let disposed = false;

    conn.start()
      .then(() => {
        if (disposed) {
          return conn.stop();
        }

        conn.invoke('JoinGroup', livestreamId).catch((err) => {
          console.warn('Failed to join group', err);
        });
      })
      .catch((err) => {
        if (!disposed) {
          console.warn('Failed to start connection', err);
        }
      });

    connRef.current = conn;

    return () => {
      disposed = true;
      if (connRef.current === conn) {
        connRef.current = null;
      }

      if (conn.state === 'Connected') {
        conn.invoke('LeaveGroup', livestreamId).catch((err) => {
          console.warn('Failed to leave group', err);
        });
      }

      conn.stop().catch((err) => {
        console.warn('Failed to stop connection', err);
      });
    };
  }, [livestreamId, apiBaseUrl]);

  return connRef;
};
