require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${port}/callback`;

// Base HTML template with Discord-inspired theme
function renderPage(title, content) {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Discord OAuth2 PoC</title>
    <style>
        :root {
            --bg-primary: #1e1f22;
            --bg-secondary: #2b2d31;
            --bg-tertiary: #313338;
            --accent: #5865f2;
            --accent-hover: #4752c4;
            --text-normal: #dbdee1;
            --text-muted: #949ba4;
            --text-heading: #f2f3f5;
            --danger: #f23f43;
            --danger-bg: rgba(242, 63, 67, 0.15);
            --danger-border: rgba(242, 63, 67, 0.4);
            --success: #23a55a;
            --success-bg: rgba(35, 165, 90, 0.15);
            --success-border: rgba(35, 165, 90, 0.4);
            --card-border: #3f4147;
            --badge-bg: #383a40;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: var(--bg-primary);
            color: var(--text-normal);
            line-height: 1.5;
            padding: 2rem 1rem;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }
        .container {
            width: 100%;
            max-width: 780px;
            background: var(--bg-secondary);
            border: 1px solid var(--card-border);
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }
        h1 {
            color: var(--text-heading);
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        p.subtitle {
            color: var(--text-muted);
            margin-bottom: 1.5rem;
            font-size: 0.95rem;
        }
        .section-title {
            color: var(--text-heading);
            font-size: 1.1rem;
            font-weight: 600;
            margin: 1.25rem 0 0.75rem;
        }
        .presets {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1.25rem;
        }
        .preset-btn {
            background: var(--bg-tertiary);
            color: var(--text-heading);
            border: 1px solid var(--card-border);
            border-radius: 6px;
            padding: 0.5rem 0.9rem;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
        }
        .preset-btn:hover {
            border-color: var(--accent);
            background: var(--accent);
            color: #fff;
        }
        .preset-btn.poc {
            border-color: var(--danger);
            color: #ff7b7d;
        }
        .preset-btn.poc:hover {
            background: var(--danger);
            color: #fff;
        }
        .scopes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 0.6rem;
            margin-bottom: 1.25rem;
        }
        .scope-card {
            background: var(--bg-tertiary);
            border: 1px solid var(--card-border);
            border-radius: 8px;
            padding: 0.65rem 0.85rem;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
            transition: border-color 0.15s, background 0.15s;
        }
        .scope-card:hover {
            border-color: var(--accent);
        }
        .scope-card label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            font-weight: 600;
            color: var(--text-heading);
            font-size: 0.9rem;
        }
        .scope-card input[type="checkbox"] {
            width: 16px;
            height: 16px;
            accent-color: var(--accent);
            cursor: pointer;
        }
        .scope-desc {
            font-size: 0.75rem;
            color: var(--text-muted);
            padding-left: 1.5rem;
        }
        .custom-scope-box {
            margin-bottom: 1.25rem;
        }
        .custom-scope-box label {
            display: block;
            font-size: 0.85rem;
            font-weight: 500;
            margin-bottom: 0.35rem;
            color: var(--text-heading);
        }
        .custom-scope-box input {
            width: 100%;
            background: var(--bg-tertiary);
            border: 1px solid var(--card-border);
            border-radius: 6px;
            padding: 0.6rem 0.8rem;
            color: var(--text-heading);
            font-family: inherit;
            font-size: 0.9rem;
            outline: none;
        }
        .custom-scope-box input:focus {
            border-color: var(--accent);
        }
        .preview-box {
            background: var(--bg-primary);
            border: 1px solid var(--card-border);
            border-radius: 8px;
            padding: 0.9rem;
            margin-bottom: 1.5rem;
        }
        .preview-box .label {
            font-size: 0.75rem;
            text-transform: uppercase;
            font-weight: 700;
            color: var(--text-muted);
            letter-spacing: 0.5px;
            margin-bottom: 0.35rem;
        }
        .scope-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            margin-bottom: 0.6rem;
        }
        .badge {
            background: var(--badge-bg);
            color: #5865f2;
            padding: 0.2rem 0.55rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-family: monospace;
            font-weight: 600;
            border: 1px solid rgba(88, 101, 242, 0.3);
        }
        .badge.highlight-danger {
            color: var(--danger);
            border-color: var(--danger);
        }
        .badge.highlight-success {
            color: var(--success);
            border-color: var(--success);
        }
        .url-preview {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
            padding: 0.5rem;
            font-family: monospace;
            font-size: 0.75rem;
            word-break: break-all;
            color: var(--text-muted);
            max-height: 80px;
            overflow-y: auto;
        }
        .btn-submit {
            display: inline-block;
            width: 100%;
            text-align: center;
            background: var(--accent);
            color: #fff;
            padding: 0.85rem 1.25rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: background 0.2s;
        }
        .btn-submit:hover {
            background: var(--accent-hover);
        }
        .btn-secondary {
            display: inline-block;
            background: var(--bg-tertiary);
            color: var(--text-normal);
            padding: 0.6rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            text-decoration: none;
            border: 1px solid var(--card-border);
            transition: all 0.2s;
        }
        .btn-secondary:hover {
            background: var(--card-border);
            color: #fff;
        }
        .alert {
            padding: 1rem 1.25rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            border: 1px solid;
        }
        .alert-danger {
            background: var(--danger-bg);
            border-color: var(--danger-border);
            color: #ff9193;
        }
        .alert-success {
            background: var(--success-bg);
            border-color: var(--success-border);
            color: #8be4af;
        }
        .alert-info {
            background: rgba(88, 101, 242, 0.15);
            border-color: rgba(88, 101, 242, 0.4);
            color: #a5b4fc;
        }
        .alert h2 {
            font-size: 1.15rem;
            margin-bottom: 0.35rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .user-card {
            display: flex;
            align-items: center;
            gap: 1rem;
            background: var(--bg-tertiary);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
        }
        .user-avatar {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            border: 2px solid var(--accent);
            background: #000;
        }
        .user-meta h3 {
            color: var(--text-heading);
            font-size: 1.1rem;
        }
        .user-meta p {
            color: var(--text-muted);
            font-size: 0.85rem;
        }
        pre.json-dump {
            background: #111214;
            border: 1px solid var(--card-border);
            border-radius: 8px;
            padding: 1rem;
            color: #e0e2e5;
            font-family: monospace;
            font-size: 0.8rem;
            overflow-x: auto;
            max-height: 350px;
        }
    </style>
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>`;
}

// Generate the authorization URL for a given space-separated scope string
function buildAuthUrl(scopes) {
    const scopeStr = (scopes || 'identify').trim();
    return `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scopeStr)}`;
}

// Main route: interactive UI with scope picker
app.get('/', (req, res) => {
    const content = `
        <h1>⚡ Discord OAuth2 Scope Tester</h1>
        <p class="subtitle">Sélectionnez les scopes OAuth2 à demander et observez si l'API Discord retourne l'email ou d'autres données sensibles sans consentement explicite.</p>

        <div class="section-title">🚀 Préréglages rapides</div>
        <div class="presets">
            <button type="button" class="preset-btn poc" onclick="applyPreset(['identify'])">🎯 PoC Bypass (<code>identify</code> seul)</button>
            <button type="button" class="preset-btn" onclick="applyPreset(['identify', 'email'])">🛡️ Standard (<code>identify email</code>)</button>
            <button type="button" class="preset-btn" onclick="applyPreset(['identify', 'guilds'])">🌐 Profil + Guilds (<code>identify guilds</code>)</button>
            <button type="button" class="preset-btn" onclick="applyPreset(['identify', 'connections', 'guilds'])">🔍 Profil étendu</button>
        </div>

        <form id="scopeForm" action="/login" method="GET">
            <div class="section-title">📋 Choix des Scopes</div>
            <div class="scopes-grid">
                <div class="scope-card" onclick="toggleCheckbox('scope-identify')">
                    <label>
                        <input type="checkbox" id="scope-identify" value="identify" checked onchange="updateScopes()">
                        identify
                    </label>
                    <span class="scope-desc">Profil de base (pseudo, avatar, bannière)</span>
                </div>
                <div class="scope-card" onclick="toggleCheckbox('scope-email')">
                    <label>
                        <input type="checkbox" id="scope-email" value="email" onchange="updateScopes()">
                        email
                    </label>
                    <span class="scope-desc">Adresse email vérifiée de l'utilisateur</span>
                </div>
                <div class="scope-card" onclick="toggleCheckbox('scope-guilds')">
                    <label>
                        <input type="checkbox" id="scope-guilds" value="guilds" onchange="updateScopes()">
                        guilds
                    </label>
                    <span class="scope-desc">Liste des serveurs rejoints</span>
                </div>
                <div class="scope-card" onclick="toggleCheckbox('scope-guilds-join')">
                    <label>
                        <input type="checkbox" id="scope-guilds-join" value="guilds.join" onchange="updateScopes()">
                        guilds.join
                    </label>
                    <span class="scope-desc">Rejoindre des serveurs automatiquement</span>
                </div>
                <div class="scope-card" onclick="toggleCheckbox('scope-connections')">
                    <label>
                        <input type="checkbox" id="scope-connections" value="connections" onchange="updateScopes()">
                        connections
                    </label>
                    <span class="scope-desc">Comptes tiers liés (Steam, GitHub, etc.)</span>
                </div>
                <div class="scope-card" onclick="toggleCheckbox('scope-messages-read')">
                    <label>
                        <input type="checkbox" id="scope-messages-read" value="messages.read" onchange="updateScopes()">
                        messages.read
                    </label>
                    <span class="scope-desc">Lire les messages des canaux</span>
                </div>
            </div>

            <div class="custom-scope-box">
                <label for="customScopes">Scopes additionnels personnalisés (séparés par un espace) :</label>
                <input type="text" id="customScopes" placeholder="ex: role_connections.write bot" oninput="updateScopes()">
            </div>

            <!-- Hidden input that carries the final merged scope query to /login -->
            <input type="hidden" name="scope" id="finalScopeInput" value="identify">

            <div class="preview-box">
                <div class="label">Scopes sélectionnés :</div>
                <div class="scope-badges" id="badgesContainer">
                    <span class="badge">identify</span>
                </div>

                <div class="label">URL d'autorisation Discord générée :</div>
                <div class="url-preview" id="urlPreview"></div>
            </div>

            <button type="submit" class="btn-submit">🚀 Lancer le test d'autorisation Discord</button>
        </form>

        <script>
            const clientId = "${CLIENT_ID || ''}";
            const redirectUri = "${REDIRECT_URI || ''}";

            function getSelectedScopes() {
                const checkboxes = document.querySelectorAll('.scopes-grid input[type="checkbox"]:checked');
                const selected = Array.from(checkboxes).map(cb => cb.value);
                const customVal = document.getElementById('customScopes').value.trim();
                if (customVal) {
                    customVal.split(/\\s+/).forEach(s => {
                        if (s && !selected.includes(s)) selected.push(s);
                    });
                }
                return selected;
            }

            function updateScopes() {
                const scopes = getSelectedScopes();
                const scopeStr = scopes.length > 0 ? scopes.join(' ') : 'identify';

                document.getElementById('finalScopeInput').value = scopeStr;

                // Update Badges
                const container = document.getElementById('badgesContainer');
                container.innerHTML = '';
                scopes.forEach(sc => {
                    const b = document.createElement('span');
                    b.className = 'badge' + (sc === 'identify' ? ' highlight-danger' : (sc === 'email' ? ' highlight-success' : ''));
                    b.textContent = sc;
                    container.appendChild(b);
                });

                // Update URL preview
                const authUrl = "https://discord.com/api/oauth2/authorize?client_id=" + encodeURIComponent(clientId)
                    + "&redirect_uri=" + encodeURIComponent(redirectUri)
                    + "&response_type=code&scope=" + encodeURIComponent(scopeStr);

                document.getElementById('urlPreview').textContent = authUrl;
            }

            function applyPreset(presets) {
                document.querySelectorAll('.scopes-grid input[type="checkbox"]').forEach(cb => {
                    cb.checked = presets.includes(cb.value);
                });
                document.getElementById('customScopes').value = '';
                updateScopes();
            }

            function toggleCheckbox(id) {
                // Prevent duplicate trigger if clicked directly on input or label
                if (event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'label') {
                    return;
                }
                const cb = document.getElementById(id);
                if (cb) {
                    cb.checked = !cb.checked;
                    updateScopes();
                }
            }

            // Init on load
            updateScopes();
        </script>
    `;
    res.send(renderPage('Choix des Scopes', content));
});

// Route /login: Redirects to Discord OAuth2 with requested scopes
app.get('/login', (req, res) => {
    let requestedScope = req.query.scope;
    if (Array.isArray(requestedScope)) {
        requestedScope = requestedScope.join(' ');
    }
    const finalScope = (requestedScope || 'identify').trim();
    const authUrl = buildAuthUrl(finalScope);
    res.redirect(authUrl);
});

// Callback route: Exchanges the code and inspects granted scope vs returned data
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.send(renderPage('Erreur', `
            <h1>❌ Erreur</h1>
            <p>Aucun code d'autorisation reçu de Discord.</p>
            <br>
            <a href="/" class="btn-secondary">← Retour à la démo</a>
        `));
    }

    try {
        // 1. Exchange authorization code for Access Token
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
        const grantedScope = tokenResponse.data.scope || '';
        const grantedList = grantedScope ? grantedScope.split(' ') : [];
        const hasEmailScope = grantedList.includes('email');

        // 2. Query /users/@me with the token
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const userData = userResponse.data;
        const emailReturned = Boolean(userData.email);

        // 3. PoC Verdict
        let verdictAlert = '';
        if (emailReturned && !hasEmailScope) {
            verdictAlert = `
                <div class="alert alert-danger">
                    <h2>🚨 FAILLE CONFIRMÉE (Scope Bypass) !</h2>
                    <p>L'adresse email <strong>${userData.email}</strong> a été retournée par <code>GET /users/@me</code> alors que le scope <code>email</code> <strong>n'a PAS été accordé</strong> (Scopes accordés : <code>${grantedScope || 'aucun'}</code>).</p>
                    <p style="margin-top: 0.5rem; font-size: 0.85rem;">Ceci démontre que l'API Discord divulgue l'email de l'utilisateur sans son consentement explicite.</p>
                </div>
            `;
        } else if (emailReturned && hasEmailScope) {
            verdictAlert = `
                <div class="alert alert-success">
                    <h2>✅ Comportement Normal</h2>
                    <p>L'adresse email <strong>${userData.email}</strong> a été retournée, ce qui est légitime puisque le scope <code>email</code> a bien été demandé et accordé.</p>
                </div>
            `;
        } else {
            verdictAlert = `
                <div class="alert alert-info">
                    <h2>🔒 Aucun email retourné</h2>
                    <p>L'API n'a retourné aucun email. Le scope <code>email</code> n'était pas accordé, comportement normal et sécurisé.</p>
                </div>
            `;
        }

        // Avatar URL
        const avatarUrl = userData.avatar
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=128`
            : `https://cdn.discordapp.com/embed/avatars/${(parseInt(userData.discriminator || '0', 10) % 5) || 0}.png`;

        const content = `
            <h1>Résultats de l'autorisation</h1>
            <p class="subtitle">Analyse des données retournées par l'API Discord par rapport aux scopes accordés.</p>

            ${verdictAlert}

            <div class="user-card">
                <img class="user-avatar" src="${avatarUrl}" alt="Avatar">
                <div class="user-meta">
                    <h3>${userData.global_name || userData.username} <span style="font-size: 0.85rem; color: var(--text-muted);">(@${userData.username})</span></h3>
                    <p>ID Utilisateur : <code>${userData.id}</code></p>
                    <p>Email retourné : <strong style="color: ${emailReturned ? 'var(--danger)' : 'var(--text-muted)'};">${userData.email || 'Aucun'}</strong></p>
                    <p>Scopes accordés par le Token : <code>${grantedScope || 'aucun'}</code></p>
                </div>
            </div>

            <div class="section-title">📦 Données brutes retournées (/users/@me)</div>
            <pre class="json-dump">${JSON.stringify(userData, null, 2)}</pre>

            <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                <a href="/" class="btn-submit" style="width: auto;">🔄 Tester un autre scope</a>
            </div>
        `;

        res.send(renderPage('Résultat du Test', content));

    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
        res.status(500).send(renderPage('Erreur', `
            <h1>❌ Erreur lors de l'échange OAuth2</h1>
            <p style="color: var(--danger); margin-bottom: 1rem;">${error.response && error.response.data ? JSON.stringify(error.response.data) : error.message}</p>
            <a href="/" class="btn-secondary">← Retour à la démo</a>
        `));
    }
});

app.listen(port, () => {
    console.log(`PoC Server started on http://localhost:${port}`);
});