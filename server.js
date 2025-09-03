const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Import power analysis functions
const powerAnalysis = require('./src/powerAnalysis');

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Power analysis endpoints
app.post('/api/power-analysis', (req, res) => {
    try {
        const { testType, parameters } = req.body;
        const result = powerAnalysis.calculatePower(testType, parameters);
        res.json({ success: true, result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/sample-size', (req, res) => {
    try {
        const { testType, parameters } = req.body;
        const result = powerAnalysis.calculateSampleSize(testType, parameters);
        res.json({ success: true, result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/power-curve', (req, res) => {
    try {
        const { testType, parameters } = req.body;
        const result = powerAnalysis.generatePowerCurve(testType, parameters);
        res.json({ success: true, result });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Get available test types
app.get('/api/test-types', (req, res) => {
    const testTypes = powerAnalysis.getAvailableTestTypes();
    res.json({ success: true, testTypes });
});

app.listen(PORT, () => {
    console.log(`DOE Power Testing App running on http://localhost:${PORT}`);
});