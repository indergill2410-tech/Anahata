const PocketBase = require('pocketbase/cjs');

const POCKETBASE_URL = process.env.POCKETBASE_URL;

if (!POCKETBASE_URL) {
  console.warn(
    '[PocketBase] WARNING: POCKETBASE_URL not set.\n' +
    '  Set it in your .env file. DB calls will return errors until configured.'
  );
}

const pb = POCKETBASE_URL ? new PocketBase(POCKETBASE_URL) : null;

module.exports = pb;
