const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '50mb' }));

let sock = null;
let currentQR = null;
let isConnected = false;
let connectedPhone = null;
let isConnecting = false;

async function connectToWhatsApp() {
    if (isConnecting) return;
    isConnecting = true;

    try {
        const authDir = path.join(__dirname, 'auth_session');
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(authDir);

        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            defaultQueryTimeoutMs: 60000
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                currentQR = qr;
                isConnected = false;
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error)?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                isConnected = false;
                connectedPhone = null;
                isConnecting = false;

                if (shouldReconnect) {
                    console.log('[WhatsApp] Connection lost. Reconnecting in 3s...');
                    setTimeout(connectToWhatsApp, 3000);
                } else {
                    console.log('[WhatsApp] Session logged out. Clearing auth cache...');
                    try {
                        if (fs.existsSync(authDir)) {
                            fs.rmSync(authDir, { recursive: true, force: true });
                        }
                    } catch (e) {}
                    setTimeout(connectToWhatsApp, 2000);
                }
            } else if (connection === 'open') {
                console.log('[WhatsApp] ✓ Successfully Connected to WhatsApp Cloud!');
                isConnected = true;
                currentQR = null;
                isConnecting = false;
                try {
                    const idStr = sock?.user?.id || '';
                    connectedPhone = idStr.split(':')[0] || idStr.split('@')[0] || 'Linked';
                } catch (e) {
                    connectedPhone = 'Linked';
                }
            }
        });

        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        console.error('[WhatsApp] Connection init error:', err);
        isConnecting = false;
        setTimeout(connectToWhatsApp, 5000);
    }
}

// Check Connection Status
app.get('/api/status', (req, res) => {
    res.json({
        connected: isConnected,
        phone: connectedPhone,
        hasQR: !!currentQR
    });
});

// Fetch QR Code for UI Pairing (returns Base64 PNG)
app.get('/api/qr', async (req, res) => {
    try {
        if (isConnected) {
            return res.json({ connected: true, qr: null, image: null, phone: connectedPhone });
        }
        if (!currentQR) {
            return res.json({ connected: false, qr: null, image: null, phone: null });
        }
        const dataUrl = await QRCode.toDataURL(currentQR, { width: 300, margin: 2 });
        res.json({
            connected: false,
            qr: currentQR,
            image: dataUrl,
            phone: null
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Logout / Disconnect WhatsApp Device
app.post('/api/logout', async (req, res) => {
    try {
        console.log('[WhatsApp] Logout requested...');
        if (sock) {
            try { await sock.logout(); } catch (e) {}
        }
        const authDir = path.join(__dirname, 'auth_session');
        if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
        }
        isConnected = false;
        connectedPhone = null;
        currentQR = null;
        isConnecting = false;
        setTimeout(connectToWhatsApp, 1500);
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Send Text Message
app.post('/api/sendText', async (req, res) => {
    try {
        const { chatId, text } = req.body;
        if (!chatId || !text) {
            return res.status(400).json({ error: 'chatId and text required' });
        }
        if (!isConnected || !sock) {
            return res.status(503).json({ error: 'WhatsApp not connected yet. Please link WhatsApp in Settings.' });
        }

        const jid = chatId.replace('@c.us', '@s.whatsapp.net');
        await sock.sendMessage(jid, { text });
        console.log(`[WhatsApp Sent Text] -> ${chatId}`);
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error('[WhatsApp Send Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// Send PDF Document Attachment
app.post('/api/sendFile', async (req, res) => {
    try {
        const { chatId, file, caption } = req.body;
        if (!chatId || !file || !file.data) {
            return res.status(400).json({ error: 'chatId and file.data required' });
        }
        if (!isConnected || !sock) {
            return res.status(503).json({ error: 'WhatsApp not connected yet. Please link WhatsApp in Settings.' });
        }

        const jid = chatId.replace('@c.us', '@s.whatsapp.net');
        const buffer = Buffer.from(file.data, 'base64');
        await sock.sendMessage(jid, {
            document: buffer,
            mimetype: file.mimetype || 'application/pdf',
            fileName: file.filename || 'Invoice.pdf',
            caption: caption || ''
        });
        console.log(`[WhatsApp Sent PDF] -> ${chatId} (${file.filename || 'Invoice.pdf'})`);
        res.json({ success: true, message: 'PDF sent successfully' });
    } catch (err) {
        console.error('[WhatsApp File Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// Optional Browser Dashboard for Testing
app.get('/', (req, res) => {
    if (isConnected) {
        res.send(`
            <html><body style="font-family:sans-serif; text-align:center; padding:50px; background:#f4f6f8;">
                <div style="background:white; max-width:450px; margin:auto; padding:30px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                    <h1 style="color:#107c10; font-size:48px; margin:0;">✓</h1>
                    <h2 style="color:#2c3e50; margin:10px 0;">WhatsApp Connected</h2>
                    <p style="color:#555;">Linked to: <b>${connectedPhone || 'Your WhatsApp'}</b></p>
                    <p style="color:#888; font-size:12px;">Ready to send invoices automatically.</p>
                </div>
            </body></html>
        `);
    } else {
        res.send(`
            <html><head><meta http-equiv="refresh" content="3"></head>
            <body style="font-family:sans-serif; text-align:center; padding:50px; background:#f4f6f8;">
                <div style="background:white; max-width:450px; margin:auto; padding:30px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                    <h2>WhatsApp Initializing...</h2>
                    <p>Open the Billing Software -> Settings tab to scan QR code.</p>
                </div>
            </body></html>
        `);
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`[WhatsApp Bridge] Running silently on: http://localhost:${PORT}`);
    connectToWhatsApp();
});
