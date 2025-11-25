# WA Gateway API Endpoints

All endpoints require Basic Authentication unless otherwise specified.

## Session Management

### List Sessions
- **GET** `/session/`
- **Description**: Get all sessions (admin) or your session (regular user)
- **Response**: Array of session names

### Start Session
- **POST** `/session/start`
- **GET** `/session/start?session=<session_name>`
- **Description**: Start a new WhatsApp session. Returns QR code if connection is pending.
- **Request Body** (POST):
  ```json
  {
    "session": "session_name"
  }
  ```
- **Response**: 
  ```json
  {
    "qr": "data:image/png;base64,...",
    "session": "session_name"
  }
  ```
  or
  ```json
  {
    "data": {
      "message": "Connected",
      "session": "session_name"
    }
  }
  ```

### Get QR Code
- **GET** `/session/:session/qr`
- **Description**: Get the current QR code for a session that's in the process of connecting. Use this to poll for QR code updates.
- **Response**:
  ```json
  {
    "data": {
      "qr": "data:image/png;base64,...",
      "session": "session_name"
    }
  }
  ```
- **Errors**: 
  - `404`: QR code not found (session not connecting or already connected)
  - `400`: Session is already connected

### Get Session Status
- **GET** `/session/:session/status`
- **Description**: Get detailed status information about a session
- **Response**:
  ```json
  {
    "data": {
      "session": "session_name",
      "exists": true,
      "is_connected": true,
      "has_qr": false,
      "user": {
        "id": "1234567890@s.whatsapp.net",
        "name": "User Name"
      }
    }
  }
  ```

### Check if Number/Group Exists
- **POST** `/session/check-exists`
- **GET** `/session/check-exists?session=<session>&target=<number>@s.whatsapp.net`
- **Description**: Check if a phone number or group exists on WhatsApp
- **Request Body** (POST):
  ```json
  {
    "session": "session_name",
    "target": "5521900000000@s.whatsapp.net"
  }
  ```
- **Response**:
  ```json
  {
    "data": {
      "exists": true,
      "target": "5521900000000@s.whatsapp.net"
    }
  }
  ```

### Delete/Logout Session
- **ALL** `/session/logout`
- **Description**: Delete a session
- **Query/Body**: `session=<session_name>`
- **Response**:
  ```json
  {
    "data": "success"
  }
  ```

## Message Operations

### Send Text Message
- **POST** `/message/send-text`
- **Description**: Send a text message
- **Request Body**:
  ```json
  {
    "session": "session_name",
    "to": "5521900000000@s.whatsapp.net",
    "text": "Hello!",
    "is_group": false,
    "quoted_message_id": "MESSAGE_ID" // optional, for replying
  }
  ```

### Send Image
- **POST** `/message/send-image`
- **Description**: Send an image message
- **Request Body**:
  ```json
  {
    "session": "session_name",
    "to": "5521900000000@s.whatsapp.net",
    "text": "Check this out!",
    "image_url": "https://example.com/image.jpg",
    "is_group": false,
    "quoted_message_id": "MESSAGE_ID" // optional
  }
  ```

### Send Document
- **POST** `/message/send-document`
- **Description**: Send a document
- **Request Body**:
  ```json
  {
    "session": "session_name",
    "to": "5521900000000@s.whatsapp.net",
    "text": "Here's the document",
    "document_url": "https://example.com/file.pdf",
    "document_name": "file.pdf",
    "is_group": false,
    "quoted_message_id": "MESSAGE_ID" // optional
  }
  ```

### Send Sticker
- **POST** `/message/send-sticker`
- **Description**: Send a sticker
- **Request Body**:
  ```json
  {
    "session": "session_name",
    "to": "5521900000000@s.whatsapp.net",
    "image_url": "https://example.com/sticker.webp",
    "is_group": false,
    "quoted_message_id": "MESSAGE_ID" // optional
  }
  ```

## Profile Operations

### Get Profile Information
- **POST** `/profile/`
- **Description**: Get profile information for a phone number or group
- **Request Body**:
  ```json
  {
    "session": "session_name",
    "target": "5521900000000@s.whatsapp.net"
  }
  ```

## Dashboard Operations (User-specific)

### Get Session Info
- **GET** `/dashboard/session-info`
- **Description**: Get your session information and configuration
- **Response**:
  ```json
  {
    "data": {
      "session_name": "username",
      "callback_url": "https://example.com/webhook",
      "webhook_auth_type": "none",
      "is_connected": true,
      ...
    }
  }
  ```

### Update Callback URL
- **PUT** `/dashboard/callback`
- **Description**: Update your webhook callback URL
- **Request Body**:
  ```json
  {
    "callback_url": "https://example.com/webhook"
  }
  ```

### Update Webhook Authentication
- **PUT** `/dashboard/webhook-auth`
- **Description**: Configure webhook authentication (Basic, OAuth, Bearer)
- **Request Body**:
  ```json
  {
    "webhook_auth_type": "oauth",
    "webhook_auth_username": "client_id",
    "webhook_auth_password": "client_secret",
    "webhook_auth_token_url": "https://example.com/oauth/token",
    "webhook_oauth_format": "oauth2"
  }
  ```

### Start Session (Dashboard)
- **POST** `/dashboard/start-session`
- **Description**: Start your session (uses your username as session name)
- **Response**: Returns QR code if connection is pending

### Disconnect Session
- **POST** `/dashboard/disconnect-session`
- **Description**: Disconnect your session

## Admin Operations

### List Users
- **GET** `/admin/users`
- **Description**: Get all users (admin only)
- **Response**: Array of users (passwords excluded)

### Create User
- **POST** `/admin/users`
- **Description**: Create a new user (admin only)
- **Request Body**:
  ```json
  {
    "username": "newuser",
    "password": "password123"
  }
  ```

### Update User Password
- **PUT** `/admin/users/:id/password`
- **Description**: Update a user's password (admin only)
- **Request Body**:
  ```json
  {
    "password": "newpassword"
  }
  ```

### Update User Session Configuration
- **PUT** `/admin/users/:id/session-config`
- **Description**: Update a user's session configuration (admin only)
- **Request Body**:
  ```json
  {
    "callback_url": "https://example.com/webhook",
    "webhook_auth_type": "oauth",
    ...
  }
  ```

### Delete User
- **DELETE** `/admin/users/:id`
- **Description**: Delete a user (admin only)

## Notes

- All endpoints require Basic Authentication
- Regular users can only access/modify their own session (username = session name)
- Admin users can access all sessions and manage users
- QR codes are stored temporarily (5 minutes TTL) and cleared when session connects
- Use the `/session/:session/qr` endpoint to poll for QR code updates during connection
- Session status can be checked via `/session/:session/status` endpoint


