require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 8080;
const KEYS_FILE = path.join(__dirname, 'keys.json');
const uri = process.env.MONGO_URI;

let db, keysCollection;

if (uri) {
    MongoClient.connect(uri)
        .then(client => {
            db = client.db('gta6');
            keysCollection = db.collection('keys');
            console.log('Connected to MongoDB database');
        })
        .catch(err => {
            console.error('Failed to connect to MongoDB, using local fallback:', err);
        });
} else {
    console.log('No MONGO_URI found in environment, falling back to keys.json local storage');
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Local fallback helpers
function readKeysLocal() {
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

function writeKeysLocal(keys) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

// Helper to read keys from MongoDB or fallback to local JSON
async function getKeys() {
    if (keysCollection) {
        try {
            const keysArray = await keysCollection.find({}).toArray();
            const keysObj = {};
            keysArray.forEach(k => {
                const { _id, ...data } = k;
                keysObj[_id] = data;
            });
            return keysObj;
        } catch (e) {
            console.error('Error fetching keys from MongoDB, using local fallback:', e);
            return readKeysLocal();
        }
    } else {
        return readKeysLocal();
    }
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
app.post('/api/generate', async (req, res) => {
    const { user } = req.body;
    const newKey = generateKeyString();
    const keyData = {
        activated: false,
        fingerprint: null,
        activatedAt: null,
        user: user || ''
    };
    
    if (keysCollection) {
        try {
            await keysCollection.insertOne({ _id: newKey, ...keyData });
            return res.json({ success: true, key: newKey });
        } catch (e) {
            console.error('MongoDB generate error, falling back to local file:', e);
        }
    }
    
    // Fallback
    const keys = readKeysLocal();
    keys[newKey] = keyData;
    writeKeysLocal(keys);
    res.json({ success: true, key: newKey });
});

// API: Delete/Revoke a key
app.delete('/api/keys/:key', async (req, res) => {
    const keyToDelete = req.params.key;
    
    if (keysCollection) {
        try {
            const result = await keysCollection.deleteOne({ _id: keyToDelete });
            if (result.deletedCount > 0) {
                return res.json({ success: true, message: 'Key deleted successfully.' });
            } else {
                return res.json({ success: false, message: 'Key not found.' });
            }
        } catch (e) {
            console.error('MongoDB delete error, falling back to local file:', e);
        }
    }
    
    // Fallback
    const keys = readKeysLocal();
    if (keys[keyToDelete]) {
        delete keys[keyToDelete];
        writeKeysLocal(keys);
        res.json({ success: true, message: 'Key deleted successfully.' });
    } else {
        res.json({ success: false, message: 'Key not found.' });
    }
});

// API: List all keys for generator table
app.get('/api/keys', async (req, res) => {
    const keys = await getKeys();
    res.json(keys);
});

// API: Verify key and fingerprint status on load
app.post('/api/verify', async (req, res) => {
    const { key, fingerprint } = req.body;
    if (!key || !fingerprint) {
        return res.json({ success: false, reason: 'Missing key or fingerprint' });
    }
    
    const keys = await getKeys();
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
app.post('/api/activate', async (req, res) => {
    const { key, fingerprint } = req.body;
    if (!key || !fingerprint) {
        return res.json({ success: false, reason: 'Key and device info are required.' });
    }
    
    if (keysCollection) {
        try {
            const keyDoc = await keysCollection.findOne({ _id: key });
            if (!keyDoc) {
                return res.json({ success: false, reason: 'License key not found. Please verify spelling.' });
            }
            
            if (keyDoc.activated) {
                if (keyDoc.fingerprint === fingerprint) {
                    return res.json({ success: true, message: 'Already activated on this PC.' });
                } else {
                    return res.json({ success: false, reason: 'Activation failed: Key already locked to another computer.' });
                }
            }
            
            // Bind the key to this PC/fingerprint
            await keysCollection.updateOne(
                { _id: key },
                {
                    $set: {
                        activated: true,
                        fingerprint: fingerprint,
                        activatedAt: new Date().toISOString()
                    }
                }
            );
            return res.json({ success: true, message: 'Activation successful! Your license is now bound to this PC.' });
        } catch (e) {
            console.error('MongoDB activation error, falling back to local file:', e);
        }
    }
    
    // Fallback
    const keys = readKeysLocal();
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
    
    keyData.activated = true;
    keyData.fingerprint = fingerprint;
    keyData.activatedAt = new Date().toISOString();
    
    writeKeysLocal(keys);
    res.json({ success: true, message: 'Activation successful! Your license is now bound to this PC.' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`GTA 6 pre-order server running on http://localhost:${PORT}`);
});
