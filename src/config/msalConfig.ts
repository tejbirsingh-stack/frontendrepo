import type { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID, // Your Client ID from Azure
        authority: "https://login.microsoftonline.com/common", // "common" allows personal + business accounts
        redirectUri: "/",
        navigateToLoginRequestUrl: false,
    }
};
