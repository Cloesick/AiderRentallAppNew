import anthropic
from dotenv import load_dotenv
import os
from flask import Flask, jsonify

# Load environment variables
load_dotenv()

# Access the API key
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY is not set in the environment variables.")

# Initialize the Anthropic client
client = anthropic.Anthropic(api_key=api_key)

# Initialize Flask app
app = Flask(__name__)

# Define a home route
@app.route("/")
def home():
    return jsonify({"message": "Welcome to the Anthropic API integration!"})

# Define a route to generate messages
@app.route("/generate-messages", methods=["GET"])
def generate_messages():
    # Create a batch of messages
    message_batch = client.messages.batches.create(
        requests=[
            {
                "custom_id": "first-prompt-in-my-batch",
                "params": {
                    "model": "claude-3-5-haiku-20241022",
                    "max_tokens": 100,
                    "messages": [
                        {
                            "role": "user",
                            "content": "Hey Claude, tell me a short fun fact about video games!",
                        }
                    ],
                },
            },
            {
                "custom_id": "second-prompt-in-my-batch",
                "params": {
                    "model": "claude-3-7-sonnet-20250219",
                    "max_tokens": 100,
                    "messages": [
                        {
                            "role": "user",
                            "content": "Hey Claude, tell me a short fun fact about bees!",
                        }
                    ],
                },
            },
        ]
    )
    # Return the response as JSON
    return jsonify(message_batch)

# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)