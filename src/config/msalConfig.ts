import type { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || "c583b1ae-a24e-4bfa-8f59-0d587210e63e",
        authority: "https://login.microsoftonline.com/common", // "common" allows personal + business accounts
        redirectUri: typeof window !== 'undefined' ? window.location.origin : "/",
        postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : "/",
        navigateToLoginRequestUrl: false,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};
