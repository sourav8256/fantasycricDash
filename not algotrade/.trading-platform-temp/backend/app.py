from flask import Flask, jsonify

app = Flask(__name__)

# Sample strategies data
strategies = [
    {
        "id": "double-calendar",
        "name": "Double Calendar",
        "type": "Time Based",
        "instrument": "NIFTY"
    },
    {
        "id": "straddle-hedge",
        "name": "Straddle with Hedge",
        "type": "Time Based",
        "instrument": "BANKNIFTY"
    },
    {
        "id": "bollinger-reversal",
        "name": "Bollinger Band Reversal",
        "type": "Indicator Based",
        "instrument": "FINNIFTY"
    }
]

@app.route('/api/strategies', methods=['GET'])
def get_strategies():
    return jsonify(strategies)

if __name__ == '__main__':
    app.run(debug=True) 