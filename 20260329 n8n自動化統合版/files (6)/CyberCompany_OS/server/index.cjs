const express = require('express');
const cors = require('cors');
const { startEngine, getStatus } = require('./bonsai_engine.cjs');


const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// API: エージェントの状態を取得
app.get('/api/status', (req, res) => {
    res.json(getStatus());
});

// エンジンの起動
startEngine();

app.listen(PORT, () => {
    console.log(`\n[SYSTEM] Bonsai8B Backend API running on port ${PORT}`);
    console.log(`[SYSTEM] Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
