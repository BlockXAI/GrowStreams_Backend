import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';

config();

import { connect } from './sails-client.mjs';
import healthRouter from './routes/health.mjs';
import streamsRouter from './routes/streams.mjs';
import vaultRouter from './routes/vault.mjs';
import splitsRouter from './routes/splits.mjs';
import permissionsRouter from './routes/permissions.mjs';
import bountyRouter from './routes/bounty.mjs';
import identityRouter from './routes/identity.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('short'));
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api/streams', streamsRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/splits', splitsRouter);
app.use('/api/permissions', permissionsRouter);
app.use('/api/bounty', bountyRouter);
app.use('/api/identity', identityRouter);

app.get('/', (req, res) => {
  res.json({
    name: 'GrowStreams V2 API',
    version: '2.0.0',
    description: 'Money streaming infrastructure for Vara Network — like Superfluid, but for Polkadot/Vara',
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
        create: 'POST /api/streams { receiver, token, flowRate, initialDeposit, mode? }',
        update: 'PUT /api/streams/:id { flowRate, mode? }',
        pause: 'POST /api/streams/:id/pause',
        resume: 'POST /api/streams/:id/resume',
        deposit: 'POST /api/streams/:id/deposit { amount, mode? }',
        withdraw: 'POST /api/streams/:id/withdraw',
        stop: 'POST /api/streams/:id/stop',
        liquidate: 'POST /api/streams/:id/liquidate',
      },
      vault: {
        config: 'GET /api/vault/config',
        paused: 'GET /api/vault/paused',
        balance: 'GET /api/vault/balance/:owner/:token',
        allocation: 'GET /api/vault/allocation/:streamId',
        deposit: 'POST /api/vault/deposit { token, amount, mode? }',
        withdraw: 'POST /api/vault/withdraw { token, amount, mode? }',
        depositNative: 'POST /api/vault/deposit-native { amount, mode? }',
        withdrawNative: 'POST /api/vault/withdraw-native { amount, mode? }',
        pause: 'POST /api/vault/pause',
        unpause: 'POST /api/vault/unpause',
      },
      splits: {
        total: 'GET /api/splits/total',
        getGroup: 'GET /api/splits/:id',
        ownerGroups: 'GET /api/splits/owner/:address',
        preview: 'GET /api/splits/:id/preview/:amount',
        create: 'POST /api/splits { recipients, mode? }',
        update: 'PUT /api/splits/:id { recipients, mode? }',
        delete: 'DELETE /api/splits/:id',
        distribute: 'POST /api/splits/:id/distribute { token, amount, mode? }',
      },
      permissions: {
        check: 'GET /api/permissions/check/:granter/:grantee/:scope',
        byGranter: 'GET /api/permissions/granter/:address',
        byGrantee: 'GET /api/permissions/grantee/:address',
        grant: 'POST /api/permissions/grant { grantee, scope, expiresAt?, mode? }',
        revoke: 'POST /api/permissions/revoke { grantee, scope, mode? }',
        revokeAll: 'POST /api/permissions/revoke-all { grantee, mode? }',
      },
      bounty: {
        total: 'GET /api/bounty/total',
        open: 'GET /api/bounty/open',
        getBounty: 'GET /api/bounty/:id',
        byCreator: 'GET /api/bounty/creator/:address',
        byClaimer: 'GET /api/bounty/claimer/:address',
        create: 'POST /api/bounty { title, token, maxFlowRate, minScore, totalBudget, mode? }',
        claim: 'POST /api/bounty/:id/claim',
        verify: 'POST /api/bounty/:id/verify { claimer, score, mode? }',
        complete: 'POST /api/bounty/:id/complete',
        cancel: 'POST /api/bounty/:id/cancel',
      },
      identity: {
        oracle: 'GET /api/identity/oracle',
        total: 'GET /api/identity/total',
        getBinding: 'GET /api/identity/binding/:actorId',
        byGithub: 'GET /api/identity/github/:username',
        bind: 'POST /api/identity/bind { actorId, githubUsername, proofHash, score, mode? }',
        revoke: 'POST /api/identity/revoke { actorId, mode? }',
        updateScore: 'POST /api/identity/update-score { actorId, newScore, mode? }',
      },
      _note: 'POST routes accept { mode: "payload" } to return encoded payload for client-side wallet signing instead of server-side execution.',
    },
  });
});

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
      console.log(`[api] GrowStreams V2 API listening on port ${PORT}`);
      console.log(`[api] http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[fatal]', err.message);
    process.exit(1);
  }
}

start();
