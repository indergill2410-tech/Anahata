const PocketBase = require('pocketbase/cjs');

const POCKETBASE_URL = process.env.POCKETBASE_URL;

if (!POCKETBASE_URL) {
  console.warn(
    '[PocketBase] WARNING: POCKETBASE_URL not set.\n' +
    '  Set it in your .env file. DB calls will return errors until configured.'
  );
}

const pb = POCKETBASE_URL ? new PocketBase(POCKETBASE_URL) : null;

if (pb && process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
  pb.admins.authWithPassword(process.env.POCKETBASE_ADMIN_EMAIL, process.env.POCKETBASE_ADMIN_PASSWORD)
    .then(() => console.log('[PocketBase] Authenticated as admin.'))
    .catch(err => console.error('[PocketBase] Admin auth failed:', err.message));
}

module.exports = pb;
