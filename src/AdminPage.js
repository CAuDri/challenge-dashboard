import React from "react";
import TimerControl from "./TimerControl";
import TeamTable from "./TeamTable";
import TrafficLightControl from "./TrafficLightControl";

function AdminPage() {
  return (
    <div>
      <div className='container'>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <TimerControl />
          <TrafficLightControl />
        </div>
        <TeamTable />
      </div>
    </div>
  );

}

export default AdminPage;
