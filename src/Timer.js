import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { API_URL } from './App';

const Timer = () => {
  const [milliseconds, setMilliseconds] = useState(0);
  const socketRef = useRef();

  function getMinutes() {
    return Math.floor((milliseconds / 1000) / 60);
  }

  function getSeconds() {
    return Math.floor((milliseconds / 1000) % 60);
  }

  function getCentiseconds() {
    return Math.floor((milliseconds / 10) % 100);
  }

  useEffect(() => {
    socketRef.current = io.connect(API_URL);
    socketRef.current.on('timer', function (data) {
      setMilliseconds(data.milliseconds);
    });
  }, []);

  return (
    <div className="timer">
      <div className="display">
        <table>
          <tbody>
            <tr className="segment-display">
              <td>{String(getMinutes()).padStart(2, "0")}</td>
              <td>:</td>
              <td>{String(getSeconds()).padStart(2, "0")}</td>
              <td>:</td>
              <td>{String(getCentiseconds()).padStart(2, "0")}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Timer;
