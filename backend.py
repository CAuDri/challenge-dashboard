import threading
import time
from flask import Flask, jsonify, request
from datetime import datetime
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)


socketio = SocketIO(app, cors_allowed_origins="*")
milliseconds = 1000 * 60
timer_thread = None

with open("results.json", "r") as f:
    team_data = json.load(f)


class TimerThread(threading.Thread):
    def __init__(self):
        super().__init__()
        self.running = False

    def run(self):
        global milliseconds
        while True:
            if self.running:
                milliseconds -= 10
            if milliseconds < 0:
                self.running = False
                milliseconds = 0
            socketio.emit('timer', {'milliseconds': milliseconds})
            time.sleep(0.01)


class TeamInfoThread(threading.Thread):
    def __init__(self):
        super().__init__()

    def run(self):
        global team_data
        while True:
            socketio.emit('teams', team_data)
            time.sleep(1)


@app.route("/teams/get", methods=["GET"])
def get_teams():
    global team_data
    return jsonify(team_data)


# end point for adding a team
@app.route("/teams/add", methods=["POST"])
def add_team():
    global team_data
    data = request.get_json()
    team_data.append(data)
    # with open("results.json", "w") as f:
    #     json.dump(team_data, f)
    return jsonify(team_data)


# end point for setting options of a team
@app.route("/teams/set", methods=["POST"])
def set_team():
    global team_data
    data = request.get_json()
    team_data = data
    return jsonify(team_data)


@app.route('/timer/start', methods=["POST"])
def start_timer():
    global timer_thread
    timer_thread.running = True
    return 'Timer started'


@app.route('/timer/stop', methods=["POST"])
def stop_timer():
    global timer_thread
    timer_thread.running = False
    return 'Timer stopped'


@app.route('/timer/set', methods=["POST"])
def set_timer():
    global milliseconds
    data = request.get_json()
    if isinstance(data["milliseconds"], int):
        milliseconds = data["milliseconds"]
        print(milliseconds)
    else:
        print(f"not a number: {data['milliseconds']}")
    return f"Timer set to {milliseconds} ms"


if __name__ == "__main__":
    timer_thread = TimerThread()
    timer_thread.start()
    team_info_thread = TeamInfoThread()
    team_info_thread.start()
    socketio.run(app, debug=True)
