const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const KEYS_FILE = path.join(__dirname, 'keys.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Helper to load keys
function readKeys() {
    try {
        if (!fs.existsSync(KEYS_FILE)) {
            fs.writeFileSync(KEYS_FILE, JSON.stringify({}));
        }
        const data = fs.readFileSync(KEYS_FILE, 'utf8');
        return JSON.parse(data || '{}');
    } catch (e) {
        return {};
    }
}

// Helper to save keys
function writeKeys(keys) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// Generate a key (e.g. GTA6-XXXX-XXXX-XXXX-XXXX)
function generateKeyString() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => {
        let str = '';
        for (let i = 0; i < 4; i++) {
            str += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return str;
    };
    return `GTA6-${segment()}-${segment()}-${segment()}-${segment()}`;
}

// API: Generate new key
app.post('/api/generate', (req, res) => {
    const keys = readKeys();
    const newKey = generateKeyString();
    
    keys[newKey] = {
        activated: false,
        fingerprint: null,
        activatedAt: null
    };
    
    writeKeys(keys);
    res.json({ success: true, key: newKey });
});

// API: List all keys for generator table
app.get('/api/keys', (req, res) => {
    const keys = readKeys();
    res.json(keys);
});

// API: Verify key and fingerprint status on load
app.post('/api/verify', (req, res) => {
    const { key, fingerprint } = req.body;
    if (!key || !fingerprint) {
        return res.json({ success: false, reason: 'Missing key or fingerprint' });
    }
    
    const keys = readKeys();
    const keyData = keys[key];
    
    if (!keyData) {
        return res.json({ success: false, reason: 'Invalid license key.' });
    }
    
    if (keyData.activated) {
        if (keyData.fingerprint === fingerprint) {
            return res.json({ success: true, message: 'Key authorized.' });
        } else {
            return res.json({ success: false, reason: 'This key is already locked to another computer.' });
        }
    } else {
        return res.json({ success: false, reason: 'This key is not activated yet.' });
    }
});

// API: Activate a key with a fingerprint
app.post('/api/activate', (req, res) => {
    const { key, fingerprint } = req.body;
    if (!key || !fingerprint) {
        return res.json({ success: false, reason: 'Key and device info are required.' });
    }
    
    const keys = readKeys();
    const keyData = keys[key];
    
    if (!keyData) {
        return res.json({ success: false, reason: 'License key not found. Please verify spelling.' });
    }
    
    if (keyData.activated) {
        if (keyData.fingerprint === fingerprint) {
            return res.json({ success: true, message: 'Already activated on this PC.' });
        } else {
            return res.json({ success: false, reason: 'Activation failed: Key already locked to another computer.' });
        }
    }
    
    // Bind the key to this PC/fingerprint
    keyData.activated = true;
    keyData.fingerprint = fingerprint;
    keyData.activatedAt = new Date().toISOString();
    
    writeKeys(keys);
    res.json({ success: true, message: 'Activation successful! Your license is now bound to this PC.' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`GTA 6 pre-order server running on http://localhost:${PORT}`);
});
