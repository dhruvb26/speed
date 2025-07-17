#!/usr/bin/env python3
"""
Simple test script for the chat API endpoints
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_chat_health():
    """Test the chat health endpoint"""
    print("Testing chat health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/chat/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_chat_send():
    """Test the chat send endpoint"""
    print("\nTesting chat send endpoint...")
    try:
        payload = {
            "message": "Hello, how are you?",
            "thread_id": "test-thread-1"
        }
        response = requests.post(f"{BASE_URL}/chat/send", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_thread_info():
    """Test the thread info endpoint"""
    print("\nTesting thread info endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/chat/threads/test-thread-1")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_chat_stream():
    """Test the chat stream endpoint"""
    print("\nTesting chat stream endpoint...")
    try:
        payload = {
            "message": "Tell me a short joke",
            "thread_id": "test-stream-1"
        }
        response = requests.post(f"{BASE_URL}/chat/stream", json=payload, stream=True)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("Streaming response:")
            for line in response.iter_lines():
                if line:
                    decoded_line = line.decode('utf-8')
                    if decoded_line.startswith('data: '):
                        data = json.loads(decoded_line[6:])
                        print(f"  {data}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Run all tests"""
    print("Starting chat API tests...")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_chat_health),
        ("Send Message", test_chat_send),
        ("Thread Info", test_thread_info),
        ("Stream Chat", test_chat_stream)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        print("-" * 30)
        success = test_func()
        results.append((test_name, success))
        time.sleep(1)  # Small delay between tests
    
    print("\n" + "=" * 50)
    print("Test Results:")
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    all_passed = all(success for _, success in results)
    print(f"\nOverall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")

if __name__ == "__main__":
    main() 