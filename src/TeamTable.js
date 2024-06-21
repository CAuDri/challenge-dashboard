import React, { useState, useEffect } from "react";
import { MaterialPicker, RGBColor } from "react-color";
import { API_URL } from "./App";

function TeamTable() {
  const [teams, setTeams] = useState([]);
  const [teamColors, setTeamColors] = useState([]);
  const [timer, setTimer] = useState(0);

  // get the teams from the server
  useEffect(() => {
    fetch(API_URL + "/teams/get")
      .then((response) => response.json())
      .then((data) => {
        setTeams(data);
        return data;
      })
      .then((data) =>
        setTeamColors(
          data.map((team) => {
            return { r: team.color[0], g: team.color[1], b: team.color[2] };
          }),
        ),
      );
  }, []);

  function updateTeamName(id, value) {
    setTeams(
      teams.map((team) => (team.id === id ? { ...team, name: value } : team)),
    );
    console.log(teams);
  }

  function updateTeamColor(id, value) {
    console.log(value);
    teamColors[id] = value;
    // read the color from the string
    const color = [value.rgb.r, value.rgb.g, value.rgb.b];
    setTeams(
      teams.map((team) => (team.id === id ? { ...team, color: color } : team)),
    );
    console.log(teams);
  }

  function updateTeamPoints(id, value) {
    setTeams(
      teams.map((team) => (team.id === id ? { ...team, points: value } : team)),
    );
    console.log(teams);
  }

  function addTeam() {
    setTeams([
      ...teams,
      { id: Math.max(teams.map(team => team.id)) + 1, name: "", color: [0, 0, 0], points: 0 },
    ]);
  }

  function saveChanges() {
    fetch(API_URL + "/teams/set", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(teams),
    });
  }

  // table with the rows: team id, team name, team color, team points.
  // also a button that adds a new team to the table. the fields of each team should be editable
  // by the user. below a button for saving the changes.
  // also add a buton to each row for dropping that row
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Team ID</th>
            <th>Team Name</th>
            <th>Team Color</th>
            <th>Team Points</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.id}>
              <td>{team.id}</td>
              <td>
                <input
                  value={team.name}
                  onChange={(e) => updateTeamName(team.id, e.target.value)}
                />
              </td>
              <td>
                <MaterialPicker
                  color={teamColors[team.id]}
                  onChangeComplete={(e) => updateTeamColor(team.id, e)}
                />
              </td>
              <td>
                <input
                  value={team.points}
                  onChange={(e) => updateTeamPoints(team.id, e.target.value)}
                />
              </td>
              <td>
                <button
                  onClick={() =>
                    setTeams(teams.filter((e) => team.id !== e.id))
                  }
                >
                  Drop
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => addTeam()}>Add Team</button>
      <button onClick={() => saveChanges()}>Save</button>
    </div>
  );
}

export default TeamTable;
