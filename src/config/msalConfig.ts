import type { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || "c3f3c839-56fa-414c-97c8-46a02c1a6147",
        authority: "https://login.microsoftonline.com/common", // "common" allows personal + business accounts
        redirectUri: "/",
        navigateToLoginRequestUrl: false,
    }
};
