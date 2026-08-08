## Login

POST /api/v1/auth/login

### Request

{
  "email": "duy@example.com",
  "password": "Password123"
}

### Response 200

{
  "success": true,
  "data": {
    "accessToken": "...",
    "user": {}
  }
}