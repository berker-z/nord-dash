import { db, auth } from "./firebase";
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    collection,
    getDocs,
    deleteDoc
} from "firebase/firestore";
import { signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { CalendarAccount, CalendarConfig } from "../types";
import { GOOGLE_CLIENT_ID, ALLOWED_EMAILS } from "../config";
import { listCalendars } from "./calendarService";

// --- Types ---

interface TokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
}

// --- Helpers ---

const getDocRef = (email: string) => doc(db, "users", email);
const getAccountRef = (userEmail: string, accountEmail: string) =>
    doc(db, "users", userEmail, "calendarAccounts", accountEmail);

const normalizeToPrimaryCalendar = (calendars: CalendarConfig[], accountEmail?: string): CalendarConfig[] => {
    if (!calendars || calendars.length === 0) return [];
    const primary =
        calendars.find((cal) => cal.primary) ||
        calendars.find((cal) => cal.id === accountEmail) ||
        calendars.find((cal) => cal.id === "primary") ||
        calendars[0];
    return [
        {
            ...primary,
            primary: true,
            isVisible: true,
        },
    ];
};

// --- Core Auth Logic ---

export const handleIdentityLogin = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!window.google || !window.google.accounts) return reject("Google API not loaded");

        const client = window.google.accounts.oauth2.initCodeClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: "openid email profile https://www.googleapis.com/auth/calendar",
            ux_mode: "popup",
            callback: async (response: any) => {
                if (response.code) {
                    try {
                        // 1. Exchange Code
                        const tokens = await exchangeCodeForToken(response.code);

                        // 2. Get Profile to verify whitelist
                        const profile = await fetchUserProfile(tokens.access_token);
                        if (!ALLOWED_EMAILS.includes(profile.email)) {
                            throw new Error(`UNAUTHORIZED_USER: ${profile.email}`);
                        }

                        // 3. Sign into Firebase using the access token
                        const credential = GoogleAuthProvider.credential(null, tokens.access_token);
                        await signInWithCredential(auth, credential);

                        // 4. Persist Primary Account Tokens
                        // The primary account is also a "Calendar Account"
                        await saveCalendarAccount(profile.email, profile.email, tokens, profile);

                        resolve();
                    } catch (e) {
                        console.error("Identity Login Failed", e);
                        reject(e);
                    }
                } else {
                    reject("No code returned");
                }
            },
        });
        client.requestCode();
    });
};

export const connectCalendarAccount = async (
    currentUserEmail: string,
    hintEmail?: string
): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!window.google || !window.google.accounts) return reject("Google API not loaded");

        const client = window.google.accounts.oauth2.initCodeClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: "email profile https://www.googleapis.com/auth/calendar",
            ux_mode: "popup",
            hint: hintEmail,
            callback: async (response: any) => {
                if (response.code) {
                    try {
                        const tokens = await exchangeCodeForToken(response.code);
                        const profile = await fetchUserProfile(tokens.access_token);

                        // Save as a sub-document under the current user
                        await saveCalendarAccount(currentUserEmail, profile.email, tokens, profile);
                        resolve();
                    } catch (e) {
                        console.error("Connect Calendar Failed", e);
                        reject(e);
                    }
                }
            },
        });
        client.requestCode();
    });
}

// --- Token Management ---

const exchangeCodeForToken = async (code: string): Promise<TokenResponse> => {
    // NOTE: This usually requires a backend because of CLIENT_SECRET.
    // Since this is a "local" personal dashboard, we are doing it client-side.
    // Ideally, use a Cloud Function or Proxy.
    // For now, importing secret from config (assuming it's available there as per previous files)
    const { GOOGLE_CLIENT_SECRET } = await import("../config");

    const params = new URLSearchParams({
        code: code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: window.location.origin,
        grant_type: 'authorization_code',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || 'Token Exchange Failed');
    return data;
};

const refreshOAuthToken = async (refreshToken: string): Promise<TokenResponse> => {
    const { GOOGLE_CLIENT_SECRET } = await import("../config");

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || 'Token Refresh Failed');
    return data;
}

// --- Data Persistence ---

const saveCalendarAccount = async (
    ownerEmail: string,
    accountEmail: string,
    tokens: TokenResponse,
    profile: any
) => {
    console.log("saveCalendarAccount called with:", { ownerEmail, accountEmail, profile });
    if (!ownerEmail) throw new Error("Owner Email is missing");
    if (!accountEmail) throw new Error("Account Email is missing");
    // 1. Fetch available calendars for this account to initialize config
    let calendars: CalendarConfig[] = [];
    try {
        const rawCalendars = await listCalendars(tokens.access_token);
        calendars = rawCalendars.map((c: any) => ({
            id: c.id,
            summary: c.summary,
            colorId: c.colorId,
            backgroundColor: c.backgroundColor,
            foregroundColor: c.foregroundColor,
            accessRole: c.accessRole,
            primary: !!c.primary || c.id === "primary",
            isVisible: true, // Default to visible
        }));
    } catch (e) {
        console.warn("Could not fetch initial calendars", e);
    }

    const accountData: CalendarAccount = {
        email: accountEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "", // Should exist on first connect
        expiresAt: Date.now() + (tokens.expires_in * 1000),
        name: profile.name,
        picture: profile.picture,
        calendars: normalizeToPrimaryCalendar(calendars, accountEmail)
    };

    // If we are updating an existing account and missing a refresh token in the response,
    // we must NOT overwrite the existing refresh token with empty string.
    if (!accountData.refreshToken) {
        const existingDoc = await getDoc(getAccountRef(ownerEmail, accountEmail));
        if (existingDoc.exists()) {
            accountData.refreshToken = existingDoc.data().refreshToken;
        }
    }

    await setDoc(getAccountRef(ownerEmail, accountEmail), accountData, { merge: true });
};

export const getConnectedAccounts = async (userEmail: string): Promise<CalendarAccount[]> => {
    const accountsRef = collection(db, "users", userEmail, "calendarAccounts");
    const snapshot = await getDocs(accountsRef);
    return snapshot.docs.map(d => {
        const data = d.data() as CalendarAccount;
        return { ...data, calendars: normalizeToPrimaryCalendar(data.calendars || [], data.email) };
    });
};

export const updateAccountToken = async (userEmail: string, accountEmail: string, newData: Partial<CalendarAccount>) => {
    await updateDoc(getAccountRef(userEmail, accountEmail), newData);
}

export const updateAccountCalendars = async (userEmail: string, accountEmail: string, calendars: CalendarConfig[]) => {
    await updateDoc(getAccountRef(userEmail, accountEmail), { calendars: normalizeToPrimaryCalendar(calendars, accountEmail) });
};

export const removeCalendarAccount = async (userEmail: string, accountEmail: string) => {
    await deleteDoc(getAccountRef(userEmail, accountEmail));
};

// --- Utils ---

const fetchUserProfile = async (accessToken: string) => {
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error_description || "Failed to fetch user profile");
    }
    if (!data.email) {
        throw new Error("User profile is missing email");
    }
    return data;
};

export const refreshAccountTokenIfNeeded = async (
    account: CalendarAccount,
    userEmail: string
): Promise<{ accessToken: string; expiresAt: number; refreshed: boolean }> => {
    const refreshThreshold = account.expiresAt - (5 * 60 * 1000);
    // Refresh 5 mins before expiry (or if already expired)
    if (Date.now() > refreshThreshold) {
        console.log(`Refreshing access token for ${account.email}`);
        try {
            const data = await refreshOAuthToken(account.refreshToken);
            const newExpiresAt = Date.now() + (data.expires_in * 1000);

            await updateAccountToken(userEmail, account.email, {
                accessToken: data.access_token,
                expiresAt: newExpiresAt
            });
            return { accessToken: data.access_token, expiresAt: newExpiresAt, refreshed: true };
        } catch (e) {
            console.error(`Failed to refresh token for ${account.email}`, e);
            throw e;
        }
    }
    return { accessToken: account.accessToken, expiresAt: account.expiresAt, refreshed: false };
}
