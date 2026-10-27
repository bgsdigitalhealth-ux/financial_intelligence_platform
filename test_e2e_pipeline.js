/**
 * E2E Pipeline Verification Utility
 * Pure dynamic architecture - Zero dummy universities, transactions, or bank accounts.
 * All institution data is managed exclusively through official API requests.
 */

async function verifyStateLedger() {
  try {
    const res = await fetch('http://localhost:5000/api/universities');
    const data = await res.json();
    console.log(`[Ledger Status] Active enrolled colleges: ${data.count || 0}`);
    return data;
  } catch (err) {
    console.error('[Ledger Status Error]', err.message);
  }
}

module.exports = { verifyStateLedger };
