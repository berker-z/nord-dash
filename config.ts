
// --- CONFIGURATION ---

// Read from environment variables (set in .env file)
// For Vite, environment variables must be prefixed with VITE_
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";

// Parse comma-separated emails from environment variable
const emailsFromEnv = import.meta.env.VITE_ALLOWED_EMAILS || "";
export const ALLOWED_EMAILS = emailsFromEnv 
  ? emailsFromEnv.split(',').map((email: string) => email.trim())
  : ["your.email@example.com"];
