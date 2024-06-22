import React from "react";
import Leaderboard from "./Leaderboard";
import Timer from "./Timer";

function MainPage() {
  return (
    <div>
      <img src="caudri_logo.jpeg" alt="Logo" width="300" />
      <div className='container'>
        <Leaderboard />
        <Timer />
      </div>
    </div>
  );

}

export default MainPage;
