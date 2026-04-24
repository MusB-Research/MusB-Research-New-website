import requests
import json

url = "http://localhost:8000/api/auth/admin/create-user/"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OWMyYWJkNmZjY2I2Y2Q4ZmExYmM4NzciLCJlbWFpbCI6ImRlbW8uY29vcmRpbmF0b3JAbXVzYnJlc2VhcmNoLmNvbSIsInJvbGUiOiJDT09SRElOQVRPUiIsImFmZmlsaWF0aW9uIjoibXVzYiIsInN0YXR1cyI6ImFjdGl2ZSIsInByb2ZpbGVfY29tcGxldGVkIjp0cnVlLCJtdXN0X2NoYW5nZV9wYXNzd29yZCI6ZmFsc2UsImlhdCI6MTc3NzAxNzA4MSwiZXhwIjoxNzc3MDQ1ODgxLCJ0eXBlIjoiYWNjZXNzIiwianRpIjoiODFlODNiNTEtOTlhNC00NTBhLWJmYTItZmMyNzNhMzQ5MDVhIn0.fL4q211W6FS1AiTJPCLhWRFcODyZ9f9l1Ag2kg6IjzGC0RBYsYlnsbCfnP8AwiFqGW2Z7gIE9xHQPkyf6327ezOd8-hUw3Ifuyk9a6FLzTKQHDvCr9tXyGki22ucWkBRMqwev0sfw5MuPNbmcvYs6lRlsJYagkwMg_DZ8ChRBWUTBlNHhA9on95m1snUtVwn6B8MRYA6licVfQE4xyMHN5gbTrNHJY6lz1wWLVTvJ4Zg9kuqgef9Gor7mMDgydrR2JOBMVBh8Gxk8rjZCowU-hmMlNQUaZDuGUCxbhppTuHm5wj6DuWxTeXg4hkbfb9uDDNtnlPow1JMqJ_Iw4yqDA"
}
payload = {
    "email": "demo.coordinator@musbresearch.com", # Existing email
    "first_name": "Demo",
    "last_name": "Coordinator",
    "role": "PI"
}

response = requests.post(url, headers=headers, data=json.dumps(payload))
print(f"Status: {response.status_code}")
print(f"Content-Length: {len(response.content)}")
print(f"Body: {response.text}")
