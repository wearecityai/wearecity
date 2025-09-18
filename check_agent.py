#!/usr/bin/env python3

import requests
import json
from google.auth import default
from google.auth.transport.requests import Request

def check_vertex_agent_status():
    """Check if Vertex AI Agent Engine is deployed and accessible"""
    
    PROJECT_ID = "wearecity-2ab89"
    LOCATION = "us-central1"
    AGENT_ENGINE_ID = "3094997688840617984"
    
    try:
        # Get default credentials
        credentials, project = default()
        credentials.refresh(Request())
        
        # Agent Engine endpoint
        url = f"https://us-central1-aiplatform.googleapis.com/v1beta1/projects/{PROJECT_ID}/locations/{LOCATION}/reasoningEngines/{AGENT_ENGINE_ID}"
        
        headers = {
            'Authorization': f'Bearer {credentials.token}',
            'Content-Type': 'application/json'
        }
        
        print(f"🔍 Checking Agent Engine status...")
        print(f"   Project: {PROJECT_ID}")
        print(f"   Location: {LOCATION}")
        print(f"   Agent ID: {AGENT_ENGINE_ID}")
        print(f"   URL: {url}")
        
        # Make request to check if agent exists
        response = requests.get(url, headers=headers)
        
        print(f"\n📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            agent_data = response.json()
            print("✅ AGENT ENGINE IS DEPLOYED AND ACTIVE")
            print(f"   Name: {agent_data.get('displayName', 'N/A')}")
            print(f"   State: {agent_data.get('state', 'N/A')}")
            print(f"   Created: {agent_data.get('createTime', 'N/A')}")
            return True
            
        elif response.status_code == 404:
            print("❌ AGENT ENGINE NOT FOUND - Not deployed or deleted")
            return False
            
        elif response.status_code == 403:
            print("🔒 PERMISSION DENIED - Check authentication")
            print(f"   Error: {response.text}")
            return False
            
        else:
            print(f"⚠️ UNEXPECTED STATUS: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR checking agent status: {e}")
        return False

if __name__ == "__main__":
    check_vertex_agent_status()