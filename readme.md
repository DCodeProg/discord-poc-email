# Discord OAuth2 Scope Bypass PoC

This repository contains a Proof of Concept (PoC) demonstrating a critical scope bypass and Broken Access Control vulnerability within the Discord OAuth2 API. 

## 🚨 Vulnerability Summary
By design, requesting the `identify` scope in an OAuth2 flow should only grant access to a user's basic profile information (username, avatar, etc.), excluding their email address. The `email` scope must be explicitly requested to access PII.

**The Issue:** When an application requests *only* the `identify` scope, the Discord authorization UI correctly asks the user for basic profile access only. However, when the backend exchanges the authorization code for an access token and queries the `GET /users/@me` endpoint, **the Discord API improperly returns the user's email address**.

This allows malicious developers to silently harvest user email addresses (PII) without informed consent, representing a severe GDPR compliance issue and a breakdown of the OAuth2 trust model.

## 🛠️ Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- A test Discord Application created in the [Discord Developer Portal](https://discord.com/developers/applications).
- The test application must have `http://localhost:3000/callback` added to its **Redirect URIs**.

## 🚀 Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DCodeProg/discord-poc-email.git
   cd discord-poc-email
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your test application's credentials:
   ```env
   CLIENT_ID=your_discord_client_id_here
   CLIENT_SECRET=your_discord_client_secret_here
   ```

4. **Start the PoC Server:**
   ```bash
   node server.js
   ```

## 🧪 Reproduction Steps
1. Navigate to `http://localhost:3000` in your web browser.
2. Click the **"Login with Discord (Test)"** button. 
   *(Note: The URL generated specifically requests `scope=identify` ONLY).*
3. Look closely at the Discord Authorization screen. It will only ask for permission to "Access your username and avatar". **It does not mention email access.**
4. Click **Authorize**.
5. You will be redirected back to the PoC application.
6. **Observe the result:** The page will display the raw JSON response from `/users/@me`. The `email` field will be populated with the user's email address, successfully proving the scope bypass.

## ⚠️ Disclaimer
This code is provided for educational and responsible disclosure purposes only. It was created specifically to demonstrate the vulnerability to the Discord Security Team via their official Bug Bounty program. Do not use this to harvest user data.