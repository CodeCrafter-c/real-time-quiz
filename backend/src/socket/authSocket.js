import jwt from "jsonwebtoken";

function extractTokenFromCookie(cookieHeader) {
  const match = cookieHeader.match(/token=([^;]+)/);
  return match ? match[1] : null;
}

export default function authSocket(socket, next) {

  const cookieHeader = socket.handshake.headers.cookie;

  if (!cookieHeader) {
    return next(new Error("No cookies"));
  }

  const token = extractTokenFromCookie(cookieHeader);

  if (!token) {
    return next(new Error("No token"));
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    socket.user = {
      userId: decoded.user_id
    };

    next();

  } catch (err) {
    next(new Error("Unauthorized"));
  }
}