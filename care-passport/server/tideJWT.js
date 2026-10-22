import { jwtVerify, createLocalJWKSet } from 'jose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

export function loadTideConfig() {
  if (process.env.CLIENT_ADAPTER) {
    return JSON.parse(process.env.CLIENT_ADAPTER);
  }
  const configPath = path.join(DATA_DIR, 'tidecloak.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

let _config = null;
let _jwks = null;

function getJwks() {
  if (!_jwks) {
    _config = loadTideConfig();
    if (!_config.jwk) {
      throw new Error('Adapter JSON missing jwk field.');
    }
    _jwks = createLocalJWKSet(_config.jwk);
  }
  return { config: _config, jwks: _jwks };
}

export async function verifyTideJWT(token) {
  const { config, jwks } = getJwks();
  const issuer = `${config['auth-server-url'].replace(/\/+$/, '')}/realms/${config.realm}`;
  const { payload } = await jwtVerify(token, jwks, { issuer });

  if (payload.azp !== config.resource) {
    throw new Error(`Token azp (${payload.azp}) does not match resource (${config.resource})`);
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired');
  }
  if (payload.iat && payload.iat > now + 60) {
    throw new Error('Token issued in future');
  }

  return payload;
}

export function hasRole(payload, role) {
  const realmRoles = payload.realm_access?.roles || [];
  if (realmRoles.includes(role)) return true;

  const resourceAccess = payload.resource_access || {};
  for (const client of Object.values(resourceAccess)) {
    if (client.roles?.includes(role)) return true;
  }
  return false;
}

export function extractToken(authHeader) {
  if (!authHeader) throw new Error('Missing Authorization header');
  if (authHeader.startsWith('Bearer ')) return authHeader.substring(7);
  if (authHeader.startsWith('DPoP ')) return authHeader.substring(5);
  throw new Error('Invalid Authorization header format (expected Bearer or DPoP)');
}
