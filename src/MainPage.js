import React from "react";
import Leaderboard from "./Leaderboard";
import Timer from "./Timer";

function MainPage() {
  return (
    <div>
      <h1>Countdown Timer</h1>
      <div className='container'>
        <Leaderboard />
        <Timer />
      </div>
    </div>
  );

}

export default MainPage;
