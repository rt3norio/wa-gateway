import * as whatsapp from "wa-multi-session";
import { Hono } from "hono";
import { requestValidator } from "../middlewares/validation.middleware";
import { z } from "zod";
import { createKeyMiddleware } from "../middlewares/key.middleware";
import { toDataURL } from "qrcode";
import { HTTPException } from "hono/http-exception";
import { basicAuthMiddleware } from "../middlewares/auth.middleware";
import type { User } from "../database/db";
import { qrStore } from "../utils/qr-store";

type Variables = {
  user: User;
};

export const createSessionController = () => {
  const app = new Hono<{ Variables: Variables }>();

  // Apply basic auth to all session routes
  app.use("*", basicAuthMiddleware());

  app.get("/", async (c) => {
    const user = c.get("user") as User;
    const allSessions = whatsapp.getAllSession();
    
    // Admin can see all sessions
    if (user.is_admin === 1) {
      return c.json({
        data: allSessions,
      });
    }
    
    // Regular users only see their single session (username = session name)
    const sessionName = user.username;
    const userSession = whatsapp.getSession(sessionName);
    
    return c.json({
      data: userSession ? [sessionName] : [],
    });
  });

  const startSessionSchema = z.object({
    session: z.string(),
  });

  app.post(
    "/start",
    requestValidator("json", startSessionSchema),
    async (c) => {
      const payload = c.req.valid("json");
      const user = c.get("user") as User;

      // Always use username as session name to maintain consistency
      const sessionName = user.username;

      const isExist = whatsapp.getSession(sessionName);
      if (isExist) {
        throw new HTTPException(400, {
          message: "Session already exist",
        });
      }

      const qr = await new Promise<string | null>(async (r) => {
        await whatsapp.startSession(sessionName, {
          onConnected() {
            qrStore.removeQR(sessionName);
            r(null);
          },
          onQRUpdated(qr) {
            qrStore.storeQR(sessionName, qr);
            r(qr);
          },
        });
      });

      if (qr) {
        const qrDataUrl = await toDataURL(qr);
        return c.json({
          qr: qrDataUrl,
          session: sessionName,
        });
      }

      return c.json({
        data: {
          message: "Connected",
          session: sessionName,
        },
      });
    }
  );
  app.get(
    "/start",
    requestValidator("query", startSessionSchema),
    async (c) => {
      const payload = c.req.valid("query");
      const user = c.get("user") as User;

      // Always use username as session name to maintain consistency
      const sessionName = user.username;

      const isExist = whatsapp.getSession(sessionName);
      if (isExist) {
        throw new HTTPException(400, {
          message: "Session already exist",
        });
      }

      const qr = await new Promise<string | null>(async (r) => {
        await whatsapp.startSession(sessionName, {
          onConnected() {
            qrStore.removeQR(sessionName);
            r(null);
          },
          onQRUpdated(qr) {
            qrStore.storeQR(sessionName, qr);
            r(qr);
          },
        });
      });

      if (qr) {
        return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp QR Code - ${sessionName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 24px;
        }
        
        .session-name {
            color: #667eea;
            font-weight: 600;
            margin-bottom: 20px;
        }
        
        .instructions {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        #qrcode {
            margin: 20px auto;
        }
        
        #qrcode img {
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .footer {
            margin-top: 30px;
            color: #999;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Scan QR Code</h1>
        <div class="session-name">Session: ${sessionName}</div>
        <div class="instructions">
            1. Open WhatsApp on your phone<br>
            2. Go to Settings → Linked Devices<br>
            3. Tap "Link a Device"<br>
            4. Scan this QR code
        </div>
        <div id="qrcode"></div>
        <div class="footer">Keep this window open until connected</div>
    </div>
    
    <script type="text/javascript">
        let qr = '${await toDataURL(qr)}'
        let image = new Image()
        image.src = qr
        document.getElementById('qrcode').appendChild(image)
    </script>
</body>
</html>
            `);
      }

      return c.json({
        data: {
          message: "Connected",
          session: sessionName,
        },
      });
    }
  );

  app.all("/logout", async (c) => {
    const user = c.get("user") as User;
    const sessionParam = c.req.query().session || (await c.req.json()).session || "";
    
    // For non-admin users, ensure they can only delete their own session (which matches their username)
    if (user.is_admin !== 1 && sessionParam !== user.username) {
      throw new HTTPException(403, {
        message: "You can only delete your own session",
      });
    }
    
    await whatsapp.deleteSession(sessionParam);
    qrStore.removeQR(sessionParam);
    return c.json({
      data: "success",
    });
  });

  // Get QR code for a session (for polling during connection)
  app.get("/:session/qr", async (c) => {
    const user = c.get("user") as User;
    const sessionName = c.req.param("session");
    
    // For non-admin users, ensure they can only access their own session
    if (user.is_admin !== 1 && sessionName !== user.username) {
      throw new HTTPException(403, {
        message: "You can only access your own session",
      });
    }

    const qr = qrStore.getQR(sessionName);
    if (!qr) {
      // Check if session is already connected
      const session = whatsapp.getSession(sessionName);
      if (session?.user) {
        throw new HTTPException(400, {
          message: "Session is already connected",
        });
      }
      throw new HTTPException(404, {
        message: "QR code not found. Session may not be in the process of connecting.",
      });
    }

    const qrDataUrl = await toDataURL(qr);
    return c.json({
      data: {
        qr: qrDataUrl,
        session: sessionName,
      },
    });
  });

  // Get session status/details
  app.get("/:session/status", async (c) => {
    const user = c.get("user") as User;
    const sessionName = c.req.param("session");
    
    // For non-admin users, ensure they can only access their own session
    if (user.is_admin !== 1 && sessionName !== user.username) {
      throw new HTTPException(403, {
        message: "You can only access your own session",
      });
    }

    const session = whatsapp.getSession(sessionName);
    const isConnected = !!(session?.user);
    const hasQR = !!qrStore.getQR(sessionName);

    return c.json({
      data: {
        session: sessionName,
        exists: !!session,
        is_connected: isConnected,
        has_qr: hasQR,
        user: session?.user ? {
          id: session.user.id,
          name: session.user.name,
        } : null,
      },
    });
  });

  // Check if a phone number or group exists
  const checkExistsSchema = z.object({
    session: z.string(),
    target: z
      .string()
      .refine((v) => v.includes("@s.whatsapp.net") || v.includes("@g.us"), {
        message: "target must contain '@s.whatsapp.net' or '@g.us'",
      }),
  });

  app.post(
    "/check-exists",
    requestValidator("json", checkExistsSchema),
    async (c) => {
      const payload = c.req.valid("json");
      const user = c.get("user") as User;
      
      // For non-admin users, ensure they can only use their own sessions
      const expectedSession = user.username;
      if (user.is_admin !== 1 && payload.session !== expectedSession) {
        throw new HTTPException(403, {
          message: `You can only use your session: ${expectedSession}`,
        });
      }
      
      const isExist = whatsapp.getSession(payload.session);
      if (!isExist) {
        throw new HTTPException(400, {
          message: "Session does not exist",
        });
      }

      const exists = await whatsapp.isExist({
        sessionId: payload.session,
        to: payload.target,
        isGroup: payload.target.includes("@g.us"),
      });

      return c.json({
        data: {
          exists,
          target: payload.target,
        },
      });
    }
  );

  // GET endpoint for checking if a number/group exists (query params)
  app.get(
    "/check-exists",
    requestValidator("query", checkExistsSchema),
    async (c) => {
      const payload = c.req.valid("query");
      const user = c.get("user") as User;
      
      // For non-admin users, ensure they can only use their own sessions
      const expectedSession = user.username;
      if (user.is_admin !== 1 && payload.session !== expectedSession) {
        throw new HTTPException(403, {
          message: `You can only use your session: ${expectedSession}`,
        });
      }
      
      const isExist = whatsapp.getSession(payload.session);
      if (!isExist) {
        throw new HTTPException(400, {
          message: "Session does not exist",
        });
      }

      const exists = await whatsapp.isExist({
        sessionId: payload.session,
        to: payload.target,
        isGroup: payload.target.includes("@g.us"),
      });

      return c.json({
        data: {
          exists,
          target: payload.target,
        },
      });
    }
  );

  return app;
};
