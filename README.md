# Project Setup Guide

## Step 1: PostgreSQL Installation and Setup

### 1.1 Create a Conda Environment  
```bash
conda create -n myenv
```

### 1.2 Activate the Environment  
```bash
conda activate myenv
```

### 1.3 Install `pgvector` via Conda Forge  
```bash
conda install -c conda-forge pgvector
```

### 1.4 Install PostgreSQL  
```bash
conda install -y -c conda-forge postgresql
```

### 1.5 Install pgAdmin  
Download from the official PostgreSQL website:  
🔗 https://www.postgresql.org/download/

### 1.6 Initialize the Database  
```bash
initdb -D local_db
```

### 1.7 Start the PostgreSQL Server  
```bash
pg_ctl -D local_db start
```

> ⚠️ If the server doesn't start, go to **Windows → Services**, stop the running PostgreSQL service, and re-run the above command.

### 1.8 Create a Database  
```bash
createdb --owner db_user test_db
```

### 1.9 Access the Database  
```bash
psql -d test_db
```

### 1.10 Create a New Admin User with All Privileges  
```sql
CREATE ROLE admin_user WITH LOGIN SUPERUSER PASSWORD 'admin';
```

### 1.11 Register Server in pgAdmin  
- Open **pgAdmin**
- Go to **Object Explorer** → Right-click on **Servers** → **Register** → **Server**

### 1.12 Configure Connection in Register Server Window  
- **General Tab:** Set a name (e.g., `Local Server`)  
- **Connection Tab:**  
  - Hostname/Address: `localhost`  
  - Username: `admin_user`  
  - Password: `admin`  
  - Save the connection

### 1.13 Open Query Tool  
- In pgAdmin, select your newly created server  
- Expand **Databases** → Right-click the database → Click **Query Tool**

### 1.14 Create Vector Extension  
```sql
CREATE EXTENSION vector;
```

---

## Step 2: Get Gemini API Key  
Ensure you have your Gemini API key (model: `gemini-2.0-flash`).  
If not, you can generate one at:  
🔗 [Google AI Studio](https://makersuite.google.com/app)

> 📌 The API key is already present in the code, but you can change it if needed.

---

## Step 3: Backend Setup and Execution

### 3.1 Navigate to the Backend Directory  
```bash
cd backend/chatbot/chatbot
```

### 3.2 Create a Virtual Environment  
```bash
python -m venv venv
```

### 3.3 Activate the Virtual Environment  
On Windows:
```bash
venv\Scripts\activate
```

On macOS/Linux:
```bash
source venv/bin/activate
```

### 3.4 Install Dependencies  
Make sure you have a `requirements.txt` file in the same directory, then run:
```bash
pip install -r requirements.txt
```

### 3.5 Create .env File
Create a file named `.env` in the `Jira_Ticketing_Chatbot\backend\chatbot\chatbot` directory with the following format:

```
# Database configuration
DB_NAME=test_db
DB_USER=admin_user
DB_PASSWORD=admin
DB_HOST=localhost
DB_PORT=5432

# Generative AI API Key
GENAI_API_KEY=<paste_your_gemini_api_key_here>

# Jira API credentials
JIRA_API_TOKEN=<paste_your_jira_api_token_here>
JIRA_EMAIL=<paste_your_jira_email_here>
JIRA_BASE_URL=<paste_your_jira_base_url_here>
```

> ⚠️ Make sure to replace the placeholder values with your actual credentials.

### 3.6 Run the Flask App  
```bash
python app.py
```

---

## Step 4: Frontend Setup and Execution

### 4.1 Open a New Terminal (Optional : If libraries are not installed)
```bash
npm install
```

### 4.2 Start React App  
```bash
npm start
```

### 4.3 Access the Frontend  
Navigate to:  
🔗 http://localhost:3000

---
