import React, { useState } from 'react';
import { TRAFFIC_LIGHT_URL } from './App';

function TrafficLightControl() {
  const [trafficLight, setTrafficLight] = useState('red');

  const changeState = (state) => {
    setTrafficLight(state);

    fetch(TRAFFIC_LIGHT_URL + '/' + state).then(response => {
      console.log(response);
    }).catch(error => {
      console.error(error);
    });
  };

  return (
    <div>
      <p>Current State: {trafficLight}</p>
      <button onClick={() => changeState("red")}>Red</button>
      <button onClick={() => changeState("yellow")}>Yellow</button>
      <button onClick={() => changeState("green")}>Green</button>
    </div>
  );
}

export default TrafficLightControl;
