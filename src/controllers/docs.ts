import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";

export const createDocsController = () => {
  const app = new Hono();

  const openApiSpec = {
    openapi: "3.1.0",
    info: {
      title: "WA Gateway API",
      version: "4.3.2",
      description: "Comprehensive WhatsApp Gateway API for managing sessions, sending messages, and configuring webhooks.",
      contact: {
        name: "API Support",
        email: "mimamch28@gmail.com",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: "http://localhost:5001",
        description: "Development server",
      },
      {
        url: "http://localhost:3002",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: "http",
          scheme: "basic",
          description: "HTTP Basic Authentication. Use your username and password.",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Error message",
            },
          },
          required: ["message"],
        },
        Session: {
          type: "object",
          properties: {
            session: {
              type: "string",
              description: "Session name",
              example: "username",
            },
          },
        },
        QRCode: {
          type: "object",
          properties: {
            qr: {
              type: "string",
              description: "QR code as data URL (base64 encoded image)",
              example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
            },
            session: {
              type: "string",
              description: "Session name",
            },
          },
        },
        SessionStatus: {
          type: "object",
          properties: {
            session: {
              type: "string",
              description: "Session name",
            },
            exists: {
              type: "boolean",
              description: "Whether the session exists",
            },
            is_connected: {
              type: "boolean",
              description: "Whether the session is connected to WhatsApp",
            },
            has_qr: {
              type: "boolean",
              description: "Whether there's a pending QR code",
            },
            user: {
              type: "object",
              nullable: true,
              properties: {
                id: {
                  type: "string",
                  description: "WhatsApp user ID",
                },
                name: {
                  type: "string",
                  description: "WhatsApp user name",
                },
              },
            },
          },
        },
        SendMessageRequest: {
          type: "object",
          required: ["session", "to", "text"],
          properties: {
            session: {
              type: "string",
              description: "Session name (must match your username for non-admin users)",
              example: "username",
            },
            to: {
              type: "string",
              description: "Recipient phone number with country code (e.g., 5521900000000@s.whatsapp.net) or group ID (e.g., 120363123456789012@g.us)",
              example: "5521900000000@s.whatsapp.net",
            },
            text: {
              type: "string",
              description: "Message text",
              example: "Hello from WA Gateway!",
            },
            is_group: {
              type: "boolean",
              description: "Whether the recipient is a group",
              default: false,
            },
            quoted_message_id: {
              type: "string",
              description: "Message ID to reply to (optional)",
              example: "AC1BFEE060D325F55FF5CB227BE18973",
            },
          },
        },
        SendImageRequest: {
          allOf: [
            { $ref: "#/components/schemas/SendMessageRequest" },
            {
              type: "object",
              required: ["image_url"],
              properties: {
                image_url: {
                  type: "string",
                  description: "URL of the image to send",
                  example: "https://example.com/image.jpg",
                },
              },
            },
          ],
        },
        SendDocumentRequest: {
          allOf: [
            { $ref: "#/components/schemas/SendMessageRequest" },
            {
              type: "object",
              required: ["document_url", "document_name"],
              properties: {
                document_url: {
                  type: "string",
                  description: "URL of the document to send",
                  example: "https://example.com/document.pdf",
                },
                document_name: {
                  type: "string",
                  description: "Name of the document",
                  example: "document.pdf",
                },
              },
            },
          ],
        },
        SendStickerRequest: {
          type: "object",
          required: ["session", "to", "image_url"],
          properties: {
            session: {
              type: "string",
              description: "Session name",
            },
            to: {
              type: "string",
              description: "Recipient phone number or group ID",
            },
            image_url: {
              type: "string",
              description: "URL of the sticker image",
            },
            is_group: {
              type: "boolean",
              default: false,
            },
            quoted_message_id: {
              type: "string",
              description: "Message ID to reply to",
            },
          },
        },
        ProfileRequest: {
          type: "object",
          required: ["session", "target"],
          properties: {
            session: {
              type: "string",
              description: "Session name",
            },
            target: {
              type: "string",
              description: "Phone number (e.g., 5521900000000@s.whatsapp.net) or group ID (e.g., 120363123456789012@g.us)",
            },
          },
        },
        CheckExistsRequest: {
          type: "object",
          required: ["session", "target"],
          properties: {
            session: {
              type: "string",
              description: "Session name",
            },
            target: {
              type: "string",
              description: "Phone number or group ID to check",
              example: "5521900000000@s.whatsapp.net",
            },
          },
        },
        CheckExistsResponse: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                exists: {
                  type: "boolean",
                  description: "Whether the number/group exists",
                },
                target: {
                  type: "string",
                  description: "The checked target",
                },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "User ID",
            },
            username: {
              type: "string",
              description: "Username",
            },
            is_admin: {
              type: "integer",
              description: "Whether user is admin (1) or regular (0)",
            },
            callback_url: {
              type: "string",
              nullable: true,
              description: "Webhook callback URL",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "User creation timestamp",
            },
          },
        },
        CreateUserRequest: {
          type: "object",
          required: ["username", "password"],
          properties: {
            username: {
              type: "string",
              minLength: 3,
              description: "Username (minimum 3 characters)",
            },
            password: {
              type: "string",
              minLength: 4,
              description: "Password (minimum 4 characters)",
            },
          },
        },
        UpdatePasswordRequest: {
          type: "object",
          required: ["password"],
          properties: {
            password: {
              type: "string",
              minLength: 4,
              description: "New password",
            },
          },
        },
        SessionConfigRequest: {
          type: "object",
          properties: {
            callback_url: {
              type: "string",
              nullable: true,
              description: "Webhook callback URL",
            },
            webhook_auth_type: {
              type: "string",
              enum: ["none", "basic", "oauth", "bearer"],
              description: "Webhook authentication type",
            },
            webhook_auth_username: {
              type: "string",
              nullable: true,
              description: "Username/client ID for webhook auth",
            },
            webhook_auth_password: {
              type: "string",
              nullable: true,
              description: "Password/client secret for webhook auth",
            },
            webhook_auth_token_url: {
              type: "string",
              nullable: true,
              description: "OAuth token URL",
            },
            webhook_auth_token: {
              type: "string",
              nullable: true,
              description: "Bearer token or cached OAuth token",
            },
            webhook_oauth_format: {
              type: "string",
              enum: ["oauth2", "json"],
              nullable: true,
              description: "OAuth format type",
            },
          },
        },
        CallbackRequest: {
          type: "object",
          properties: {
            callback_url: {
              type: "string",
              nullable: true,
              description: "Webhook callback URL",
            },
          },
        },
        WebhookAuthRequest: {
          type: "object",
          required: ["webhook_auth_type"],
          properties: {
            webhook_auth_type: {
              type: "string",
              enum: ["none", "basic", "oauth", "bearer"],
              description: "Webhook authentication type",
            },
            webhook_auth_username: {
              type: "string",
              nullable: true,
              description: "Username/client ID",
            },
            webhook_auth_password: {
              type: "string",
              nullable: true,
              description: "Password/client secret",
            },
            webhook_auth_token_url: {
              type: "string",
              nullable: true,
              description: "OAuth token URL",
            },
            webhook_auth_token: {
              type: "string",
              nullable: true,
              description: "Bearer token",
            },
            webhook_oauth_format: {
              type: "string",
              enum: ["oauth2", "json"],
              nullable: true,
              description: "OAuth format",
            },
          },
        },
      },
    },
    security: [
      {
        basicAuth: [],
      },
    ],
    tags: [
      {
        name: "Sessions",
        description: "Session management operations",
      },
      {
        name: "Messages",
        description: "Send messages via WhatsApp",
      },
      {
        name: "Profile",
        description: "Get profile information",
      },
      {
        name: "Dashboard",
        description: "User dashboard operations",
      },
      {
        name: "Admin",
        description: "Admin-only operations",
      },
    ],
    paths: {
      "/session": {
        get: {
          tags: ["Sessions"],
          summary: "List sessions",
          description: "Get all sessions (admin) or your session (regular user)",
          responses: {
            "200": {
              description: "List of sessions",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/session/start": {
        post: {
          tags: ["Sessions"],
          summary: "Start a new session",
          description: "Start a WhatsApp session. Returns QR code if connection is pending.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Session",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Session started. Returns QR code if pending, or connection message if connected.",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/QRCode" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              message: { type: "string" },
                              session: { type: "string" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "400": {
              description: "Session already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
        get: {
          tags: ["Sessions"],
          summary: "Start a new session (GET)",
          description: "Start a WhatsApp session via GET request. Returns HTML page with QR code if pending.",
          parameters: [
            {
              name: "session",
              in: "query",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            "200": {
              description: "HTML page with QR code or connection message",
              content: {
                "text/html": {
                  schema: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
      "/session/{session}/qr": {
        get: {
          tags: ["Sessions"],
          summary: "Get QR code for session",
          description: "Get the current QR code for a session that's in the process of connecting. Use this to poll for QR code updates.",
          parameters: [
            {
              name: "session",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            "200": {
              description: "QR code data",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        $ref: "#/components/schemas/QRCode",
                      },
                    },
                  },
                },
              },
            },
            "404": {
              description: "QR code not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
            "400": {
              description: "Session is already connected",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                },
              },
            },
          },
        },
      },
      "/session/{session}/status": {
        get: {
          tags: ["Sessions"],
          summary: "Get session status",
          description: "Get detailed status information about a session",
          parameters: [
            {
              name: "session",
              in: "path",
              required: true,
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            "200": {
              description: "Session status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        $ref: "#/components/schemas/SessionStatus",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/session/check-exists": {
        post: {
          tags: ["Sessions"],
          summary: "Check if number/group exists",
          description: "Check if a phone number or group exists on WhatsApp",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CheckExistsRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Existence check result",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/CheckExistsResponse",
                  },
                },
              },
            },
          },
        },
        get: {
          tags: ["Sessions"],
          summary: "Check if number/group exists (GET)",
          description: "Check if a phone number or group exists via GET request",
          parameters: [
            {
              name: "session",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "target",
              in: "query",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Existence check result",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/CheckExistsResponse",
                  },
                },
              },
            },
          },
        },
      },
      "/session/logout": {
        post: {
          tags: ["Sessions"],
          summary: "Delete/Logout session",
          description: "Delete a WhatsApp session",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Session",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Session deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "string",
                        example: "success",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/message/send-text": {
        post: {
          tags: ["Messages"],
          summary: "Send text message",
          description: "Send a text message via WhatsApp",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SendMessageRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Message sent successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        description: "Message response from WhatsApp",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/message/send-image": {
        post: {
          tags: ["Messages"],
          summary: "Send image message",
          description: "Send an image via WhatsApp",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SendImageRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Image sent successfully",
            },
          },
        },
      },
      "/message/send-document": {
        post: {
          tags: ["Messages"],
          summary: "Send document",
          description: "Send a document via WhatsApp",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SendDocumentRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Document sent successfully",
            },
          },
        },
      },
      "/message/send-sticker": {
        post: {
          tags: ["Messages"],
          summary: "Send sticker",
          description: "Send a sticker via WhatsApp",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SendStickerRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Sticker sent successfully",
            },
          },
        },
      },
      "/profile": {
        post: {
          tags: ["Profile"],
          summary: "Get profile information",
          description: "Get profile information for a phone number or group",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ProfileRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Profile information",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        description: "Profile data from WhatsApp",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/dashboard/session-info": {
        get: {
          tags: ["Dashboard"],
          summary: "Get session info",
          description: "Get your session information and configuration",
          responses: {
            "200": {
              description: "Session information",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          session_name: { type: "string" },
                          callback_url: { type: "string", nullable: true },
                          webhook_auth_type: { type: "string" },
                          is_connected: { type: "boolean" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/dashboard/callback": {
        put: {
          tags: ["Dashboard"],
          summary: "Update callback URL",
          description: "Update your webhook callback URL",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CallbackRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Callback URL updated",
            },
          },
        },
      },
      "/dashboard/webhook-auth": {
        put: {
          tags: ["Dashboard"],
          summary: "Update webhook authentication",
          description: "Configure webhook authentication (Basic, OAuth, Bearer)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/WebhookAuthRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Webhook auth updated",
            },
          },
        },
      },
      "/dashboard/start-session": {
        post: {
          tags: ["Dashboard"],
          summary: "Start session",
          description: "Start your session (uses your username as session name)",
          responses: {
            "200": {
              description: "Session started. Returns QR code if pending.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        oneOf: [
                          { $ref: "#/components/schemas/QRCode" },
                          {
                            type: "object",
                            properties: {
                              message: { type: "string" },
                              session_name: { type: "string" },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/dashboard/disconnect-session": {
        post: {
          tags: ["Dashboard"],
          summary: "Disconnect session",
          description: "Disconnect your session",
          responses: {
            "200": {
              description: "Session disconnected",
            },
          },
        },
      },
      "/admin/users": {
        get: {
          tags: ["Admin"],
          summary: "List users",
          description: "Get all users (admin only)",
          responses: {
            "200": {
              description: "List of users",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/User",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Admin"],
          summary: "Create user",
          description: "Create a new user (admin only)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateUserRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "User created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        $ref: "#/components/schemas/User",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/admin/users/{id}/password": {
        put: {
          tags: ["Admin"],
          summary: "Update user password",
          description: "Update a user's password (admin only)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: {
                type: "integer",
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdatePasswordRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Password updated",
            },
          },
        },
      },
      "/admin/users/{id}/session-config": {
        put: {
          tags: ["Admin"],
          summary: "Update user session config",
          description: "Update a user's session configuration (admin only)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: {
                type: "integer",
              },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SessionConfigRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Session config updated",
            },
          },
        },
      },
      "/admin/users/{id}": {
        delete: {
          tags: ["Admin"],
          summary: "Delete user",
          description: "Delete a user (admin only)",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: {
                type: "integer",
              },
            },
          ],
          responses: {
            "200": {
              description: "User deleted",
            },
          },
        },
      },
    },
  };

  app.get("/", swaggerUI({ url: "/docs/openapi.json" }));
  app.get("/openapi.json", (c) => {
    return c.json(openApiSpec);
  });

  return app;
};


