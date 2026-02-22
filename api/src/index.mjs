import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';

config();

import { connect } from './gear.mjs';
import healthRouter from './routes/health.mjs';
import streamsRouter from './routes/streams.mjs';
import vaultRouter from './routes/vault.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('short'));
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api/streams', streamsRouter);
app.use('/api/vault', vaultRouter);

app.get('/', (req, res) => {
  res.json({
    name: 'GrowStreams V2 API',
    version: '1.0.0',
    docs: {
      health: 'GET /health',
      streams: {
        config: 'GET /api/streams/config',
        total: 'GET /api/streams/total',
        active: 'GET /api/streams/active',
        getStream: 'GET /api/streams/:id',
        getBalance: 'GET /api/streams/:id/balance',
        getBuffer: 'GET /api/streams/:id/buffer',
        bySender: 'GET /api/streams/sender/:address',
        byReceiver: 'GET /api/streams/receiver/:address',
        create: 'POST /api/streams',
        update: 'PUT /api/streams/:id',
        pause: 'POST /api/streams/:id/pause',
        resume: 'POST /api/streams/:id/resume',
        deposit: 'POST /api/streams/:id/deposit',
        withdraw: 'POST /api/streams/:id/withdraw',
        stop: 'POST /api/streams/:id/stop',
      },
      vault: {
        config: 'GET /api/vault/config',
        paused: 'GET /api/vault/paused',
        balance: 'GET /api/vault/balance/:owner/:token',
        allocation: 'GET /api/vault/allocation/:streamId',
        deposit: 'POST /api/vault/deposit',
        withdraw: 'POST /api/vault/withdraw',
        allocate: 'POST /api/vault/allocate',
        release: 'POST /api/vault/release',
        transfer: 'POST /api/vault/transfer',
        pause: 'POST /api/vault/pause',
        unpause: 'POST /api/vault/unpause',
        setStreamCore: 'POST /api/vault/set-stream-core',
      },
    },
  });
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  console.error(`[error] ${req.method} ${req.path}: ${message}`);
  res.status(status).json({ error: message });
});

async function start() {
  try {
    await connect();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[api] GrowStreams API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('[fatal]', err.message);
    process.exit(1);
  }
}

start();
