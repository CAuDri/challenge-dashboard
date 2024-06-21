import React, { useEffect, useState, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import io from 'socket.io-client';
import { API_URL } from "./App";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
);

function toRGBA(rgbaArray) {
  return `rgba(${rgbaArray[0]}, ${rgbaArray[1]}, ${rgbaArray[2]}, 1)`;
}

function Leaderboard() {
  const [teams, setTeams] = useState([]);
  const [milliseconds, setMilliseconds] = useState(0);
  const socketRef = useRef();


  useEffect(() => {
    socketRef.current = io.connect(API_URL);
    socketRef.current.on('teams', function (data) {
      data.sort((a, b) => b.points - a.points);
      setTeams(data);
    });
  }, []);

  const colors = teams.map((team) => {
    return toRGBA(team.color);
  });

  const points = teams.map((team) => team.points);

  const options = {
    indexAxis: "y",
    elements: {
      bar: {
        borderWidth: 2,
      },
    },
    responsive: true,
  };

  const labels = teams.map((team) => team.name);

  const data = {
    labels: labels,
    datasets: [
      {
        label: "# of Points",
        data: points,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="leaderboard">
      <Bar options={options} data={data} />
    </div>
  );
}

export default Leaderboard;
