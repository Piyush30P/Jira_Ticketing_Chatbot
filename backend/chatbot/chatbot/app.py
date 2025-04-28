from flask import Flask, jsonify, request
from flask_cors import CORS
from requests.auth import HTTPBasicAuth
import requests
import os
import re
import datetime
from dotenv import load_dotenv
import google.generativeai as genai
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np
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

# Initialize database connection
conn = None
cur = None

try:
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    cur = conn.cursor()

    # Create pgvector extension if it doesn't exist
    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
    
    # Create embeddings table if it doesn't exist
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
    print("Successfully connected to the database and initialized tables.")
except psycopg2.Error as e:
    print(f"Database connection error: {e}")
    if conn:
        conn.close()

# Configure Generative AI API
api_key = os.getenv("GENAI_API_KEY")
genai.configure(api_key=api_key)

generation_config = {
    "temperature": 0.7,  # Reduced temperature for more predictable responses
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

# Ticket cache to avoid repeated API calls
ticket_cache = {
    'done': [],
    'in_progress': []
}

# Helper function to get mock tickets for testing
def get_mock_tickets(status):
    if status.lower() == 'done':
        return [
            {
                'id': '10001',
                'key': 'JIRA-10001',
                'fields': {
                    'summary': 'Add dark mode to user interface',
                    'description': {
                        'content': [
                            {
                                'content': [
                                    {'text': 'Users have requested a dark mode option for the interface to reduce eye strain.'}
                                ]
                            }
                        ]
                    },
                    'status': {'name': 'Done'},
                    'priority': {'name': 'Medium'},
                    'assignee': {'displayName': 'John Doe'},
                    'reporter': {'displayName': 'Jane Smith'},
                    'created': '2025-04-15',
                    'updated': '2025-04-20',
                    'labels': ['ui', 'enhancement', 'frontend']
                }
            },
            {
                'id': '10003',
                'key': 'JIRA-10003',
                'fields': {
                    'summary': 'Backup database',
                    'description': {
                        'content': [
                            {
                                'content': [
                                    {'text': 'We need to implement a scheduled backup system for the database to prevent data loss.'}
                                ]
                            }
                        ]
                    },
                    'status': {'name': 'Done'},
                    'priority': {'name': 'High'},
                    'assignee': {'displayName': 'Sarah Johnson'},
                    'reporter': {'displayName': 'Mike Davis'},
                    'created': '2025-04-10',
                    'updated': '2025-04-18',
                    'labels': ['database', 'maintenance', 'backend']
                }
            },
            {
                'id': '10005',
                'key': 'JIRA-10005',
                'fields': {
                    'summary': 'Implement password reset functionality',
                    'description': {
                        'content': [
                            {
                                'content': [
                                    {'text': 'Users need a way to reset their password if they forget it.'}
                                ]
                            }
                        ]
                    },
                    'status': {'name': 'Done'},
                    'priority': {'name': 'Medium'},
                    'assignee': {'displayName': 'Alex Developer'},
                    'reporter': {'displayName': 'User Support'},
                    'created': '2025-04-05',
                    'updated': '2025-04-15',
                    'labels': ['security', 'user-management', 'backend']
                }
            }
        ]
    else:
        return [
            {
                'id': '10023',
                'key': 'JIRA-10023',
                'fields': {
                    'summary': 'The storage of laptop get full',
                    'description': {
                        'content': [
                            {
                                'content': [
                                    {'text': 'The laptop storage is almost full affecting system performance. Need to clean up unnecessary files.'}
                                ]
                            }
                        ]
                    },
                    'status': {'name': 'In Progress'},
                    'priority': {'name': 'Medium'},
                    'assignee': {'displayName': 'John Doe'},
                    'reporter': {'displayName': 'Marketing Team'},
                    'created': '2025-04-25',
                    'updated': '2025-04-28',
                    'labels': ['hardware', 'maintenance']
                }
            },
            {
                'id': '10010',
                'key': 'JIRA-10010',
                'fields': {
                    'summary': 'Update website privacy policy',
                    'description': {
                        'content': [
                            {
                                'content': [
                                    {'text': 'The privacy policy needs to be updated to comply with new regulations.'}
                                ]
                            }
                        ]
                    },
                    'status': {'name': 'In Progress'},
                    'priority': {'name': 'High'},
                    'assignee': {'displayName': 'Legal Team'},
                    'reporter': {'displayName': 'Compliance Officer'},
                    'created': '2025-04-22',
                    'updated': '2025-04-26',
                    'labels': ['legal', 'website', 'compliance']
                }
            },
            {
                'id': '10009',
                'key': 'JIRA-10009',
                'fields': {
                    'summary': 'Images not loading on product page',
                    'description': {
                        'content': [
                            {
                                'content': [
                                    {'text': 'Product images are failing to load on the main product listing page. This is affecting the user experience and potentially sales.'}
                                ]
                            }
                        ]
                    },
                    'status': {'name': 'In Progress'},
                    'priority': {'name': 'Critical'},
                    'assignee': {'displayName': 'Frontend Team'},
                    'reporter': {'displayName': 'QA Team'},
                    'created': '2025-04-27',
                    'updated': '2025-04-28',
                    'labels': ['frontend', 'bug', 'ui']
                }
            },
            {
                'id': '10008',
                'key': 'JIRA-10008',
                'fields': {
                    'summary': 'Application crashes on submitting feedback form',
                    'description': {
                        'content': [
                            {
                                'content': [
                                    {'text': 'Users report that the application crashes when they try to submit the feedback form with attachments.'}
                                ]
                            }
                        ]
                    },
                    'status': {'name': 'Blocked'},
                    'priority': {'name': 'High'},
                    'assignee': {'displayName': 'Backend Team'},
                    'reporter': {'displayName': 'Customer Support'},
                    'created': '2025-04-26',
                    'updated': '2025-04-27',
                    'labels': ['bug', 'crash', 'backend']
                }
            }
        ]

# Function to fetch tickets from Jira
def fetch_jira_tickets(status='done', force_refresh=False):
    """
    Fetch tickets from Jira API based on status.
    Added force_refresh parameter to bypass cache when needed.
    """
    if not force_refresh and status.lower() in ticket_cache and ticket_cache[status.lower()]:
        print(f"Using cached tickets for status: {status}")
        return ticket_cache[status.lower()]
    
    print(f"Fetching fresh tickets with status: {status}")
    
    # For testing purposes, use mock data if flag is set
    if os.getenv("USE_MOCK_DATA", "False").lower() == "true":
        tickets = get_mock_tickets(status)
        ticket_cache[status.lower()] = tickets
        return tickets
        
    # Prepare JQL query with proper status and sorting
    jql_query = f'status = "{status}"'
    
    # Add sorting by updated date, newest first
    jql_query += ' ORDER BY updated DESC'
    
    query = {'jql': jql_query, 'maxResults': 50}
    
    try:
        response = requests.get(JIRA_SEARCH_ENDPOINT, headers=headers, auth=auth, params=query)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        tickets = response.json().get('issues', [])
        ticket_cache[status.lower()] = tickets
        
        # Store tickets in database for semantic search
        for ticket in tickets:
            store_ticket_in_postgres(ticket)
            
        return tickets
    except requests.exceptions.RequestException as e:
        print(f"Error fetching tickets with status '{status}': {e}")
        # Return cached data if available, otherwise empty list
        return ticket_cache.get(status.lower(), [])

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
    # More detailed mock comments for demo purposes
    mock_comments = {
        '10001': [
            'Implemented dark mode using CSS variables for easy switching',
            'Added toggle in user settings menu',
            'Dark mode is now available in all pages'
        ],
        '10003': [
            'Set up automated daily backups to cloud storage',
            'Added backup verification process',
            'Implemented recovery testing procedure'
        ],
        '10005': [
            'Created email reset flow with secure tokens',
            'Added rate limiting to prevent abuse',
            'Implemented user notification for successful resets'
        ],
        '10023': [
            'Analyzing disk usage to identify large files',
            'Implementing cleanup script to remove temporary files',
            'Recommending disk upgrade for future needs'
        ],
        '10010': [
            'Updated policy with new data handling procedures',
            'Legal team reviewed and approved changes',
            'Published to website with announcement banner'
        ],
        '10009': [
            'Investigating CDN issues affecting image delivery',
            'Applied temporary fix with local caching',
            'Working on permanent solution with better error handling'
        ],
        '10008': [
            'Identified memory leak when processing large attachments',
            'Currently blocked waiting for dependency update',
            'Testing workaround by limiting attachment size'
        ]
    }
    
    if os.getenv("USE_MOCK_DATA", "False").lower() == "true" and ticket_id in mock_comments:
        return mock_comments[ticket_id]
    
    # If no mock data or not in mock mode, try to get real comments
    try:
        comments_url = f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_id}/comment"
        response = requests.get(comments_url, headers=headers, auth=auth)
        
        if response.status_code == 200:
            comments = response.json().get('comments', [])
            return [comment['body']['content'][0]['content'][0].get('text', '') 
                   for comment in comments if 'body' in comment]
        else:
            print(f"Failed to fetch comments for ticket {ticket_id}: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error fetching comments for ticket {ticket_id}: {e}")
        return []

# Get embeddings for text using BERT
def get_embeddings(text):
    tokens = tokenizer(text, return_tensors='pt', truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**tokens)
    embeddings = outputs.last_hidden_state.mean(dim=1)
    return embeddings[0].numpy()

# Store ticket embeddings in PostgreSQL
def store_ticket_in_postgres(ticket):
    if not conn or not cur:
        print("Database connection not available")
        return

    ticket_id = ticket['id']
    issue_title = ticket['fields']['summary']
    description_obj = ticket['fields']['description']
    description = get_ticket_description(description_obj)
    priority = ticket['fields'].get('priority', {}).get('name', "Unknown")
    status = ticket['fields'].get('status', {}).get('name', "Unknown")

    # Fetch comments for the ticket
    comments = fetch_ticket_comments(ticket_id)
    all_comments_text = " ".join(comments) if comments else "No comments available"

    # Create the full text representation for embedding
    full_text = f"{issue_title} {description} {all_comments_text}"

    # Generate the embedding
    embedding = get_embeddings(full_text)

    # Prepare metadata
    metadata = {
        "id": ticket_id,
        "key": ticket.get('key', ''),
        "title": issue_title,
        "description": description,
        "priority": priority,
        "status": status,
        "comments": comments,
        "assignee": ticket['fields'].get('assignee', {}).get('displayName', 'Unassigned'),
        "reporter": ticket['fields'].get('reporter', {}).get('displayName', 'Unknown'),
        "created": ticket['fields'].get('created', ''),
        "updated": ticket['fields'].get('updated', ''),
        "labels": ticket['fields'].get('labels', [])
    }

    # Insert data into PostgreSQL
    try:
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
        print(f"Stored ticket {ticket_id} in database")
    except Exception as e:
        print(f"Error storing ticket {ticket_id} in database: {e}")
        if conn:
            conn.rollback()

# Find similar tickets based on semantic search
def find_similar_tickets(query_text, limit=3):
    if not conn or not cur:
        print("Database connection not available")
        return []

    try:
        query_embedding = get_embeddings(query_text)
        
        # Convert embedding to string format for PostgreSQL
        embedding_str = '{' + ','.join(map(str, query_embedding.tolist())) + '}'
        
        # Perform semantic search using cosine similarity
        cur.execute(
            """
            SELECT ticket_id, metadata, 1 - (embedding <=> %s) as similarity
            FROM jira_embeddings
            ORDER BY similarity DESC
            LIMIT %s;
            """,
            (embedding_str, limit)
        )
        
        results = cur.fetchall()
        similar_tickets = []
        
        for ticket_id, metadata_json, similarity in results:
            metadata = json.loads(metadata_json)
            metadata['similarity'] = float(similarity)
            similar_tickets.append(metadata)
        
        return similar_tickets
    except Exception as e:
        print(f"Error in semantic search: {e}")
        return []

# Format ticket details for display
def format_ticket_details(ticket):
    """Format ticket details in a readable format for display"""
    metadata = ticket if isinstance(ticket, dict) else json.loads(ticket)
    
    details = f"**Ticket ID: {metadata.get('id')}** - {metadata.get('title')}\n\n"
    details += f"**Status**: {metadata.get('status')}\n"
    details += f"**Priority**: {metadata.get('priority')}\n"
    details += f"**Assignee**: {metadata.get('assignee')}\n"
    details += f"**Created**: {metadata.get('created')}\n"
    details += f"**Last Updated**: {metadata.get('updated')}\n\n"
    details += f"**Description**:\n{metadata.get('description')}\n\n"
    
    if metadata.get('comments'):
        details += "**Recent Comments**:\n"
        for comment in metadata.get('comments'):
            details += f"- {comment}\n"
    
    return details

# Resolve Jira tickets based on user query
def resolve_jira_tickets_chatbot(conversation_history):
    # Initialize chat if not already initialized
    global chat
    if not chat:
        model = genai.GenerativeModel(model_name="gemini-2.0-flash", generation_config=generation_config, safety_settings=safety_settings)
        chat = model.start_chat()
    
    # Get the user's query
    user_query = conversation_history[-1]['message'] if conversation_history else ""
    
    if not user_query:
        return "Hello! I'm your Jira ticket assistant. You can ask about tickets, their status, or solutions for specific issues."
    
    # Check if user is asking about a specific ticket by ID
    ticket_id_match = re.search(r'(?:ticket\s+#?\s*|#\s*)(\d{5})', user_query, re.IGNORECASE)
    is_asking_for_details = 'details' in user_query.lower() or 'more about' in user_query.lower() or 'tell me about' in user_query.lower()
    
    # If user is asking for specific ticket details
    if ticket_id_match and is_asking_for_details:
        ticket_id = ticket_id_match.group(1)
        
        # Look for this ticket in our system
        # First, try to find in mock data for testing
        if os.getenv("USE_MOCK_DATA", "False").lower() == "true":
            # Get all tickets
            all_tickets = fetch_jira_tickets(status="Done") + fetch_jira_tickets(status="In Progress")
            
            # Find matching ticket
            matching_ticket = None
            for ticket in all_tickets:
                if ticket['id'] == ticket_id:
                    matching_ticket = ticket
                    break
            
            if matching_ticket:
                # Format ticket details in a structured way
                description = get_ticket_description(matching_ticket['fields']['description'])
                comments = fetch_ticket_comments(ticket_id)
                
                formatted_response = f"""
                **Ticket ID: {ticket_id}** - {matching_ticket['fields']['summary']}
                
                **Status**: {matching_ticket['fields'].get('status', {}).get('name', 'Unknown')}
                **Priority**: {matching_ticket['fields'].get('priority', {}).get('name', 'Unknown')}
                **Assignee**: {matching_ticket['fields'].get('assignee', {}).get('displayName', 'Unassigned')}
                **Created**: {matching_ticket['fields'].get('created', 'Unknown')}
                **Last Updated**: {matching_ticket['fields'].get('updated', 'Unknown')}
                
                **Description**:
                {description}
                
                **Recent Comments**:
                """
                
                # Add comments if available
                if comments:
                    for comment in comments:
                        formatted_response += f"- {comment}\n"
                else:
                    formatted_response += "No comments available."
                
                return formatted_response
    
    # Find similar tickets based on the query
    similar_tickets = find_similar_tickets(user_query)
    
    # If database search fails or no tickets match, use API to get tickets
    if not similar_tickets:
        tickets = fetch_jira_tickets(status="Done") + fetch_jira_tickets(status="In Progress")
        
        # Prepare ticket details for the AI model
        ticket_details = []
        for ticket in tickets:
            ticket_id = ticket['id']
            issue_title = ticket['fields']['summary']
            description = get_ticket_description(ticket['fields']['description'])
            
            # Keywords from the ticket for matching
            keywords = f"{issue_title} {description}".lower()
            
            # Check if query terms match this ticket
            query_terms = user_query.lower().split()
            match_score = sum(1 for term in query_terms if term in keywords)
            
            if match_score > 0:
                # This ticket is relevant to the query
                comments = fetch_ticket_comments(ticket_id)
                ticket_details.append({
                    "id": ticket_id,
                    "key": ticket.get('key', ''),
                    "title": issue_title,
                    "description": description,
                    "priority": ticket['fields'].get('priority', {}).get('name', 'Unknown'),
                    "status": ticket['fields'].get('status', {}).get('name', 'Unknown'),
                    "comments": comments,
                    "assignee": ticket['fields'].get('assignee', {}).get('displayName', 'Unassigned'),
                    "reporter": ticket['fields'].get('reporter', {}).get('displayName', 'Unknown'),
                    "created": ticket['fields'].get('created', ''),
                    "updated": ticket['fields'].get('updated', ''),
                    "match_score": match_score
                })
        
        # Sort by match score (highest first)
        similar_tickets = sorted(ticket_details, key=lambda x: x.get('match_score', 0), reverse=True)[:3]
    
    # If we have matching tickets, format them for the AI
    ticket_prompt = ""
    if similar_tickets:
        ticket_prompt = "I found some tickets that might be relevant to your query:\n\n"
        for ticket in similar_tickets:
            formatted_ticket = f"""
            Ticket ID: {ticket.get('id')}
            Title: {ticket.get('title')}
            Status: {ticket.get('status')}
            Priority: {ticket.get('priority')}
            Description: {ticket.get('description')}
            """
            
            if ticket.get('comments'):
                formatted_ticket += "Comments:\n"
                for comment in ticket.get('comments'):
                    formatted_ticket += f"- {comment}\n"
            
            ticket_prompt += formatted_ticket + "\n---\n\n"
    
    # Create prompt for the AI model
    prompt = f"""
    Act as a Jira ticket assistant called "Jira Ticket Assistant". 
    
    USER QUERY: {user_query}
    
    {ticket_prompt}
    
    When responding, please follow these guidelines:
    1. If there are relevant tickets, mention their ticket ID numbers in your response (e.g., "Based on ticket #10001...")
    2. Format ticket ID numbers consistently as "#ID" (e.g., #10001)
    3. Structure your response clearly with proper formatting
    4. If the user is asking about adding a specific feature or fixing a specific issue, check if there's a matching ticket
    5. If there are similar tickets, incorporate their solutions in your response
    6. If there are no relevant tickets, just provide a helpful response without mentioning ticket numbers
    
    Please respond to the user's query in a friendly, concise, and informative way.
    """
    
    # Get response from AI model
    response = chat.send_message(prompt)
    return response.text

# Flask app setup
app = Flask(__name__)
CORS(app)

# API endpoints
@app.route('/api/tickets', methods=['GET'])
def get_tickets():
    """Get all tickets, sorted by status (done/in progress)"""
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    done_tickets = fetch_jira_tickets(status='done', force_refresh=force_refresh)
    in_progress_tickets = fetch_jira_tickets(status='In Progress', force_refresh=force_refresh)
    return jsonify({'done': done_tickets, 'inProgress': in_progress_tickets})

@app.route('/chat', methods=['POST'])
def chat_handler():
    """Handle chat messages and return AI responses"""
    data = request.json
    message = data.get('message', '')
    conversation_history = data.get('conversation_history', [])
    response = resolve_jira_tickets_chatbot(conversation_history + [{'sender': 'user', 'message': message}])
    return jsonify({'response': response})

@app.route('/api/ticket/<ticket_id>', methods=['GET'])
def get_ticket(ticket_id):
    """
    Get details for a specific ticket by ID.
    Returns full ticket information including comments.
    """
    try:
        # Try to find in cache first
        all_tickets = (ticket_cache.get('done', []) + 
                      ticket_cache.get('in progress', []))
        
        for ticket in all_tickets:
            if ticket['id'] == ticket_id:
                # Found in cache
                description = get_ticket_description(ticket['fields']['description'])
                comments = fetch_ticket_comments(ticket_id)
                
                response_data = {
                    'id': ticket['id'],
                    'key': ticket.get('key', ''),
                    'summary': ticket['fields']['summary'],
                    'description': description,
                    'status': ticket['fields'].get('status', {}).get('name', 'Unknown'),
                    'priority': ticket['fields'].get('priority', {}).get('name', 'Medium'),
                    'assignee': ticket['fields'].get('assignee', {}).get('displayName', 'Unassigned'),
                    'reporter': ticket['fields'].get('reporter', {}).get('displayName', 'Unknown'),
                    'created': ticket['fields'].get('created', ''),
                    'updated': ticket['fields'].get('updated', ''),
                    'comments': comments,
                    'labels': ticket['fields'].get('labels', [])
                }
                
                return jsonify({'ticket': response_data})
        
        # If not in cache, try to fetch from API
        if os.getenv("USE_MOCK_DATA", "False").lower() == "true":
            # In mock mode, return not found if we didn't find it in the cache
            return jsonify({'error': f'Ticket {ticket_id} not found'}), 404
        
        # In real mode, make API call to get the ticket
        response = requests.get(
            f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_id}",
            headers=headers,
            auth=auth
        )
        
        response.raise_for_status()
        ticket_data = response.json()
        
        # Format the response
        description = get_ticket_description(ticket_data['fields']['description'])
        comments = fetch_ticket_comments(ticket_id)
        
        response_data = {
            'id': ticket_data['id'],
            'key': ticket_data.get('key', ''),
            'summary': ticket_data['fields']['summary'],
            'description': description,
            'status': ticket_data['fields'].get('status', {}).get('name', 'Unknown'),
            'priority': ticket_data['fields'].get('priority', {}).get('name', 'Medium'),
            'assignee': ticket_data['fields'].get('assignee', {}).get('displayName', 'Unassigned'),
            'reporter': ticket_data['fields'].get('reporter', {}).get('displayName', 'Unknown'),
            'created': ticket_data['fields'].get('created', ''),
            'updated': ticket_data['fields'].get('updated', ''),
            'comments': comments,
            'labels': ticket_data['fields'].get('labels', [])
        }
        
        return jsonify({'ticket': response_data})
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching ticket {ticket_id}: {e}")
        return jsonify({'error': f'Failed to fetch ticket {ticket_id}'}), 500
    except Exception as e:
        print(f"Unexpected error fetching ticket {ticket_id}: {e}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/create-ticket', methods=['POST'])
def create_ticket():
    """
    API to create a new ticket in Jira.
    Accepts JSON payload with fields: title, description, priority, assignee, and labels.
    Returns the created ticket details.
    """
    data = request.json
    title = data.get('title')
    description = data.get('description')
    priority = data.get('priority', 'Task')
    assignee = data.get('assignee')
    labels = data.get('labels', [])

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
            "description": description_adf,
            "issuetype": {
                "name": priority
            }
        }
    }

    # Add assignee if provided
    if assignee:
        payload['fields']['assignee'] = {"name": assignee}
    
    # Add labels if provided
    if labels:
        payload['fields']['labels'] = labels

    try:
        if os.getenv("USE_MOCK_DATA", "False").lower() == "true":
            # For demo/testing, create a mock ticket response
            mock_ticket_id = str(10000 + len(ticket_cache.get('in progress', [])) + len(ticket_cache.get('done', [])))
            mock_response = {
                "id": mock_ticket_id,
                "key": f"MOCK-{mock_ticket_id}",
                "self": f"http://example.com/rest/api/2/issue/{mock_ticket_id}"
            }
            
            # Add to cache as an in-progress ticket
            new_ticket = {
                "id": mock_ticket_id,
                "key": f"MOCK-{mock_ticket_id}",
                "fields": {
                    "summary": title,
                    "description": description_adf,
                    "status": {"name": "In Progress"},
                    "priority": {"name": "Medium"},
                    "assignee": {"displayName": assignee or "Unassigned"},
                    "reporter": {"displayName": "Current User"},
                    "created": datetime.datetime.now().isoformat(),
                    "updated": datetime.datetime.now().isoformat(),
                    "labels": labels
                }
            }
            
            if 'in progress' in ticket_cache:
                ticket_cache['in progress'].append(new_ticket)
            else:
                ticket_cache['in progress'] = [new_ticket]
                
            # Clear the 'done' cache to ensure it's refreshed next time
            if 'done' in ticket_cache:
                ticket_cache['done'] = []
                
            return jsonify({
                'message': 'Ticket created successfully!',
                'ticket': mock_response
            }), 201
        
        # In real mode, make the actual API call
        response = requests.post(
            f"{JIRA_BASE_URL}/rest/api/3/issue",
            headers=headers,
            auth=auth,
            json=payload
        )
        
        response.raise_for_status()  # Raise exception for HTTP errors
        
        # Get the created ticket
        created_ticket = response.json()
        
        # Clear caches to ensure fresh data on next request
        ticket_cache.clear()
        
        return jsonify({
            'message': 'Ticket created successfully!',
            'ticket': created_ticket
        }), 201
        
    except requests.exceptions.RequestException as e:
        print(f"Error creating ticket: {e}")
        error_message = "Failed to create the ticket."
        if hasattr(e, 'response') and e.response and e.response.text:
            try:
                error_details = e.response.json()
                error_message = error_details.get('errorMessages', [error_message])[0]
            except:
                error_message = f"{error_message} Status code: {e.response.status_code}"
                
        return jsonify({
            'error': error_message
        }), 500
    except Exception as e:
        print(f"Unexpected error creating ticket: {e}")
        return jsonify({
            'error': 'An unexpected error occurred while creating the ticket.'
        }), 500

@app.route('/')
def home():
    return "Welcome to the Jira Assistant API!"

if __name__ == '__main__':
    try:
        # Set environment variable for using mock data
        os.environ["USE_MOCK_DATA"] = "True"
        app.run(debug=True)
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
        print("Database connections closed.")