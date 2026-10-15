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
   Copy `.env.example` to `.env` (or create a `.env` file) and fill in your test application's credentials:
   ```env
   CLIENT_ID=your_discord_client_id_here
   CLIENT_SECRET=your_discord_client_secret_here
   ```

4. **Start the PoC Server:**
   *Directly with Node.js:*
   ```bash
   node server.js
   ```

   *Or using Docker Compose:*
   ```bash
   docker compose up -d --build
   ```

## 🧪 Reproduction Steps
1. Navigate to `http://localhost:3000` in your web browser.
2. Select your desired scopes using the interactive interface (e.g. choose the **PoC Bypass (`identify` seul)** preset).
3. Click the **"Lancer le test d'autorisation Discord"** button.
4. Look closely at the Discord Authorization screen: with `identify` only, it only asks for permission to access your username and avatar. **It does not mention email access.**
5. Click **Authorize**.
6. **Observe the result:** The application will display whether the email was retrieved despite not being granted in the scopes, proving or disproving the scope bypass.

## ⚠️ Disclaimer
This code is provided for educational and responsible disclosure purposes only. It was created specifically to demonstrate the vulnerability to the Discord Security Team via their official Bug Bounty program. Do not use this to harvest user data.