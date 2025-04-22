from flask import Flask, jsonify, request
from flask_cors import CORS
from requests.auth import HTTPBasicAuth
import requests
import os
from dotenv import load_dotenv
import google.generativeai as genai
from transformers import AutoTokenizer, AutoModel
import torch
import json

import psycopg2
from psycopg2.extras import execute_values

# Load environment variables
load_dotenv()

# Database connection settings
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

# Connect to PostgreSQL and ensure pgvector extension is installed
try:
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    cur = conn.cursor()

    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS jira_embeddings (
            ticket_id TEXT PRIMARY KEY,
            embedding vector(768),
            metadata JSONB
        );
        """
    )
    conn.commit()
except psycopg2.Error as e:
    print(f"Database connection error: {e}")
    if conn:
        conn.close()
    raise

# Configure Generative AI API
api_key = os.getenv("GENAI_API_KEY")

genai.configure(api_key=api_key)

generation_config = {
    "temperature": 0.9,
    "top_p": 0.5,
    "top_k": 5,
    "max_output_tokens": 1000,
}

safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]

chat = None

# Jira API credentials
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")
JIRA_EMAIL = os.getenv("JIRA_EMAIL")
JIRA_BASE_URL = os.getenv("JIRA_BASE_URL")
JIRA_SEARCH_ENDPOINT = f"{JIRA_BASE_URL}/rest/api/3/search"

auth = HTTPBasicAuth(JIRA_EMAIL, JIRA_API_TOKEN)
headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
}


# Load BERT model and tokenizer
tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
model = AutoModel.from_pretrained('bert-base-uncased')

# Fetch Jira tickets
def fetch_jira_tickets(status='done'):
    query = {'jql': f'status = "{status}"'}
    response = requests.get(JIRA_SEARCH_ENDPOINT, headers=headers, auth=auth, params=query)
    if response.status_code == 200:
        tickets = response.json()
        return tickets['issues']
    else:
        print(f"Failed to fetch tickets: {response.status_code}")
        return []

# Function to get ticket description
def get_ticket_description(description_obj):
    if isinstance(description_obj, dict) and 'content' in description_obj:
        paragraphs = description_obj['content']
        description_text = []
        for paragraph in paragraphs:
            if 'content' in paragraph:
                for content in paragraph['content']:
                    if 'text' in content:
                        description_text.append(content['text'])
        return " ".join(description_text)
    return "No description available"

# Function to fetch ticket comments
def fetch_ticket_comments(ticket_id):
    comments_url = f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_id}/comment"
    response = requests.get(comments_url, headers=headers, auth=auth)
    if response.status_code == 200:
        comments = response.json().get('comments', [])
        return [comment['body']['content'][0]['content'][0].get('text', '') for comment in comments if 'body' in comment]
    else:
        print(f"Failed to fetch comments for ticket {ticket_id}: {response.status_code}")
        return []

# Get embeddings for text
def get_embeddings(text):
    tokens = tokenizer(text, return_tensors='pt', truncation=True, padding=True)
    with torch.no_grad():
        outputs = model(**tokens)
    embeddings = outputs.last_hidden_state.mean(dim=1)
    return embeddings[0].numpy()

# Generate a prompt using Jira tickets
def generate_ticket_prompt(tickets):
    ticket_prompt = ""
    for ticket in tickets:
        ticket_id = ticket['id']
        issue_title = ticket['fields']['summary']
        description_obj = ticket['fields']['description']
        
        # Extract the plain text description
        description = get_ticket_description(description_obj)
        
        comments = fetch_ticket_comments(ticket_id)
        all_comments_text = " ".join(comments) if comments else "No comments available"
        
         # Combine description and comments to form a complete solution
        complete_text = (
            f"Ticket ID: {ticket_id}\n"
            f"Title: {issue_title}\n"
            f"Description: {description}\n"
            f"Solution (Comments): {all_comments_text}\n"
        )
        ticket_prompt += complete_text + "\n\n"  # Separate tickets by newlines
    
    return ticket_prompt

# Store ticket embeddings in PostgreSQL
def store_ticket_in_postgres(ticket):
    ticket_id = ticket['id']
    issue_title = ticket['fields']['summary']
    description_obj = ticket['fields']['description']
    description = get_ticket_description(description_obj)
    priority = ticket['fields']['priority']['name'] if 'priority' in ticket['fields'] else "Unknown"
    status = ticket['fields']['status']['name'] if 'status' in ticket['fields'] else "Unknown"

    # Fetch comments (solutions) for the ticket
    comments = fetch_ticket_comments(ticket_id)
    all_comments_text = " ".join(comments) if comments else "No comments available"

    # Create the full text representation
    full_text = f"{issue_title} {description} {all_comments_text}"

    # Generate the embedding
    embedding = get_embeddings(full_text)

    # Prepare metadata
    metadata = {
        "description": description,
        "priority": priority,
        "status": status,
        "summary": issue_title
    }

        # Insert data into PostgreSQL
    cur.execute(
        """
        INSERT INTO jira_embeddings (ticket_id, embedding, metadata) 
        VALUES (%s, %s, %s)
        ON CONFLICT (ticket_id) DO UPDATE 
        SET embedding = EXCLUDED.embedding, metadata = EXCLUDED.metadata;
        """,
        (ticket_id, embedding.tolist(), json.dumps(metadata))
    )
    conn.commit()


def resolve_jira_tickets_chatbot(conversation_history):
    tickets = fetch_jira_tickets(status="Done")
    prompt_data = generate_ticket_prompt(tickets)

    # Configure the chatbot with the Jira data
    model = genai.GenerativeModel(model_name="gemini-2.0-flash", generation_config=generation_config, safety_settings=safety_settings)
    global chat
    
    if not chat:
        chat = model.start_chat()
    
    # Modify the prompt for ticket-related problem-solving
    prompt = f"Act as a Jira issue-solving assistant Having name Jira ticket solver. Here are some Jira tickets and their solutions: \n\n{prompt_data}\n\nNow, based on the above information and Using the above solutions, assist me in solving new Jira tickets or answering queries about existing ones.And Here's the conversation history (if histroy is not present yet means start of bot so print intro message) while giving answer of any query give priority for the solution of exitsting simiar tickets and then frame the answer(but don't show the similar detect just use its solution and mention the Ticket Number in the response of the simalar ticket and if dont have any simalar ticket dont mention the ticket no and give response):"
    

    for entry in conversation_history:
        prompt += f"{entry['sender']}: {entry['message']}\n"
    
    prompt += "\nNow respond to the latest query based on the above history."

    # Start the chatbot loop
    response = chat.send_message(prompt)
    

    return response.text

def text_summary(text, isNew=False, conversation_history=[]):
    """
    Summarize the given text or return it based on the 'isNew' flag.
    """
    if isNew:
        # For new conversations, return the first 100 characters as a summary
        return text[:100] + "..."
    else:
        # Add the current message to the conversation history and return chatbot's response
        conversation_history.append({'sender': 'user', 'message': text})
        return resolve_jira_tickets_chatbot(conversation_history)


# Flask app
app = Flask(__name__)
CORS(app)

@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    done_tickets = fetch_jira_tickets(status='done')
    in_progress_tickets = fetch_jira_tickets(status='In Progress')
    return jsonify({'done': done_tickets, 'inProgress': in_progress_tickets})

@app.route('/chat', methods=['POST'])
def chat_handler():
    data = request.json
    message = data.get('message', '')
    conversation_history = data.get('conversation_history', [])
    response = resolve_jira_tickets_chatbot(conversation_history + [{'sender': 'user', 'message': message}])
    return jsonify({'response': response})

@app.route('/api/create-ticket', methods=['POST'])
def create_ticket():
    """
    API to create a new ticket in Jira.
    Accepts JSON payload with fields: title, description, priority, and assignee.
    """
    data = request.json
    title = data.get('title')
    description = data.get('description')
    priority = data.get('priority', 'Task')
    assignee = data.get('assignee', None)  # Optional assignee

    if not title or not description:
        return jsonify({'error': 'Title and Description are required fields.'}), 400

    # Convert plain description to Atlassian Document Format (ADF)
    description_adf = {
        "type": "doc",
        "version": 1,
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {"text": description, "type": "text"}
                ]
            }
        ]
    }

    payload = {
        "fields": {
            "project": {
                "key": "SCRUM"  # Replace 'SCRUM' with your actual Jira project key
            },
            "summary": title,
            "description": description_adf,  # Use ADF for description
            "issuetype": {
                "name": priority
            }
        }
    }

    if assignee:
        payload['fields']['assignee'] = {"name": assignee}

    response = requests.post(
        f"{JIRA_BASE_URL}/rest/api/3/issue",
        headers=headers,
        auth=auth,
        json=payload
    )

    if response.status_code == 201:
        return jsonify({
            'message': 'Ticket created successfully!',
            'ticket': response.json()
        }), 201
    else:
        return jsonify({
            'error': 'Failed to create the ticket.',
            'details': response.json()
        }), response.status_code

@app.route('/')
def home():
    return "Welcome to the Jira Assistant API!"

if __name__ == '__main__':
    try:
        app.run(debug=True)
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
        print("Database connections closed.")
