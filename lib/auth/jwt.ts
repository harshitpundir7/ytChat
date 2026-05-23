import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

// Shape of the data we store inside the token
export interface JWTPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null; // Token is invalid or expired
  }
}

// Extract user from the Authorization header of a request
// The header format is: "Bearer <token>"
export function getUserFromRequest(request: Request): JWTPayload | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1]; // Get just the token part
  return verifyToken(token);
}


