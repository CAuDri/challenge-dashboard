import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import MainPage from './MainPage';
import AdminPage from './AdminPage';

export const API_URL = 'http://localhost:5000';
export const TRAFFIC_LIGHT_URL = "http://192.168.177.34";

function App() {
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route exact path='/' component={MainPage} />
          <Route path="/admin" component={AdminPage} />
        </Switch>
      </Router>
    </div>
  );
}

export default App;

