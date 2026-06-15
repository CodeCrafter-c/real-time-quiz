const cookieOptions = {
    "httpOnly": true,
    "secure": (process.env.NODE_ENV).toLowerCase() === "production",
    "maxAge": 3600000,
    "sameSite": (process.env.NODE_ENV).toLowerCase() === "production" ? "strict" : "lax"
}