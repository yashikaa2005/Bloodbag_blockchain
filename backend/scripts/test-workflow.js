// Uses Node 18+ native fetch
const BASE_URL = 'http://localhost:5000/api';

async function post(endpoint, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function get(endpoint, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${endpoint}`, { headers });
  return { status: res.status, data: await res.json() };
}

async function runTest() {
  console.log('>>> Starting Automated Full Workflow Test <<<');

  // 1. Login Blood Bank
  console.log('1. Logging in as Blood Bank...');
  const bankLogin = await post('/auth/login', {
    email: 'bloodbank@bloodchain.org',
    password: 'password123',
  });
  if (!bankLogin.data.success) throw new Error('Blood Bank login failed');
  const bankToken = bankLogin.data.token;
  console.log('   Blood Bank logged in successfully.');

  // 2. Register a Blood Bag
  const bagId = `BC-BAG-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  console.log(`2. Registering blood bag: ${bagId}...`);
  const now = new Date();
  const expiry = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

  const regRes = await post(
    '/blood-bags/register',
    {
      bagId,
      bloodGroup: 'O+',
      collectionDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      notes: 'Automated integration test bag',
    },
    bankToken
  );
  if (!regRes.data.success) throw new Error(`Registration failed: ${regRes.data.message}`);
  console.log(`   Bag registered on blockchain! Tx: ${regRes.data.transactionHash}`);

  // 3. Login Lab
  console.log('3. Logging in as Lab...');
  const labLogin = await post('/auth/login', {
    email: 'lab@bloodchain.org',
    password: 'password123',
  });
  const labToken = labLogin.data.token;

  // 4. Lab starts testing
  console.log(`4. Starting testing for ${bagId}...`);
  const testRes = await post(`/blood-bags/${bagId}/testing`, {}, labToken);
  if (!testRes.data.success) throw new Error(`Start testing failed: ${testRes.data.message}`);
  console.log(`   Testing started! Status: ${testRes.data.newStatus}`);

  // 5. Lab approves bag
  console.log(`5. Lab approving ${bagId}...`);
  const appRes = await post(`/blood-bags/${bagId}/approve`, {}, labToken);
  if (!appRes.data.success) throw new Error(`Approval failed: ${appRes.data.message}`);
  console.log(`   Approved on blockchain! Status: ${appRes.data.newStatus}`);

  // 6. Blood bank transfers to Hospital
  console.log('6. Blood Bank transferring bag to Hospital...');
  const hospAddress = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
  const transferRes = await post(
    `/blood-bags/${bagId}/transfer`,
    { recipientAddress: hospAddress },
    bankToken
  );
  if (!transferRes.data.success) throw new Error(`Transfer failed: ${transferRes.data.message}`);
  console.log(`   Transferred to ${hospAddress}! Status: ${transferRes.data.newStatus}`);

  // 7. Login Hospital
  console.log('7. Logging in as Hospital...');
  const hospLogin = await post('/auth/login', {
    email: 'hospital@bloodchain.org',
    password: 'password123',
  });
  const hospToken = hospLogin.data.token;

  // 8. Hospital receives bag
  console.log(`8. Hospital receiving ${bagId}...`);
  const recRes = await post(`/blood-bags/${bagId}/receive`, {}, hospToken);
  if (!recRes.data.success) throw new Error(`Receive failed: ${recRes.data.message}`);
  console.log(`   Received by hospital! Status: ${recRes.data.newStatus}`);

  // 9. Public Verification
  console.log(`9. Public QR Verification for ${bagId}...`);
  const verifyRes = await get(`/verification/${bagId}`);
  if (!verifyRes.data.success) throw new Error('Verification failed');
  console.log('   Verification Result:', verifyRes.data.verificationStatus);
  console.log('   Current Status:', verifyRes.data.bloodBag.authoritativeStatus);
  console.log('   Current Custodian:', verifyRes.data.bloodBag.currentCustodian);
  console.log('   Lifecycle History Steps:', verifyRes.data.lifecycleHistory.length);

  // 10. Hospital consumes bag
  console.log(`10. Hospital consuming ${bagId}...`);
  const conRes = await post(`/blood-bags/${bagId}/consume`, {}, hospToken);
  if (!conRes.data.success) throw new Error(`Consume failed: ${conRes.data.message}`);
  console.log(`   Consumed for patient! Status: ${conRes.data.newStatus}`);

  // 11. Test Security Rule: Transfer of consumed bag should fail!
  console.log('11. Verifying that re-transfer of consumed bag fails on smart contract...');
  const failTransfer = await post(
    `/blood-bags/${bagId}/transfer`,
    { recipientAddress: hospAddress },
    hospToken
  );
  console.log(`   Security check passed! Status: ${failTransfer.status}, Error Message: "${failTransfer.data.message}"`);

  console.log('>>> All End-to-End Blockchain & Backend Workflow Checks Passed! <<<');
}

runTest().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
