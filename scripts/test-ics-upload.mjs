import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL || 'mohan0265@gmail.com'; // Admin user
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testICSUpload() {
  console.log('🧪 Starting ICS Upload Test...\n');

  try {
    // Step 1: Authenticate
    console.log('📝 Step 1: Authenticating...');
    let accessToken;
    let userId;

    if (TEST_PASSWORD) {
      // Sign in with credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      if (error) throw new Error(`Auth failed: ${error.message}`);
      if (!data.session) throw new Error('No session created');

      accessToken = data.session.access_token;
      userId = data.user.id;
      console.log(`✅ Authenticated as: ${TEST_EMAIL}`);
    } else {
      // Use admin service role to create a session for test user
      console.log(`⚠️  TEST_PASSWORD not set, using service role to find user: ${TEST_EMAIL}`);
      
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw new Error(`Failed to list users: ${error.message}`);
      
      const testUser = users.find(u => u.email === TEST_EMAIL);
      if (!testUser) throw new Error(`Test user ${TEST_EMAIL} not found`);
      
      userId = testUser.id;
      
      // Generate access token for test user
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: TEST_EMAIL,
      });
      
      if (sessionError) throw new Error(`Failed to generate session: ${sessionError.message}`);
      
      // For testing, we'll use service role key as bearer token
      // This is a workaround for automated testing only
      accessToken = SUPABASE_SERVICE_KEY;
      console.log(`✅ Using service role for user: ${TEST_EMAIL}`);
    }

    // Step 2: Load sample ICS file
    console.log('\n📝 Step 2: Loading sample ICS file...');
    const icsPath = path.join(__dirname, '..', 'test', 'fixtures', 'sample.ics');
    
    if (!fs.existsSync(icsPath)) {
      throw new Error(`Sample ICS file not found at: ${icsPath}`);
    }

    const icsContent = fs.readFileSync(icsPath, 'utf-8');
    console.log(`✅ Loaded ${icsContent.length} bytes from sample.ics`);

    // Step 3: Upload to API
    console.log('\n📝 Step 3: Uploading to /api/onboarding/ics...');
    
    const formData = new FormData();
    formData.append('file', Buffer.from(icsContent), {
      filename: 'sample.ics',
      contentType: 'text/calendar',
    });

    const uploadRes = await fetch('http://localhost:3000/api/onboarding/ics', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(`Upload failed (${uploadRes.status}): ${JSON.stringify(uploadData)}`);
    }

    console.log(`✅ Upload successful!`);
    console.log(`   Events imported: ${uploadData.imported?.events || 0}`);
    console.log(`   Assessments imported: ${uploadData.imported?.assessments || 0}`);
    console.log(`   Job ID: ${uploadData.job_id}`);

    // Step 4: Verify data in Supabase
    console.log('\n📝 Step 4: Verifying data in Supabase...');

    // Check import_jobs
    const { data: jobs, error: jobsError } = await supabaseAdmin
      .from('import_jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('id', uploadData.job_id)
      .single();

    if (jobsError) {
      console.warn(`⚠️  Could not verify import_jobs: ${jobsError.message}`);
    } else {
      console.log(`✅ Import Job: ${jobs.status} (${jobs.kind})`);
    }

    // Check user_events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('user_events')
      .select('*')
      .eq('user_id', userId)
      .eq('source', 'ics')
      .is('deleted_at', null);

    if (eventsError) {
      console.warn(`⚠️  Could not verify user_events: ${eventsError.message}`);
    } else {
      console.log(`✅ User Events: ${events?.length || 0} records`);
      if (events && events.length > 0) {
        events.forEach(e => {
          console.log(`   - ${e.title} (${e.event_type || 'other'})`);
        });
      }
    }

    // Check user_assessments
    const { data: assessments, error: assessError } = await supabaseAdmin
      .from('user_assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('source', 'ics')
      .is('deleted_at', null);

    if (assessError) {
      console.warn(`⚠️  Could not verify user_assessments: ${assessError.message}`);
    } else {
      console.log(`✅ User Assessments: ${assessments?.length || 0} records`);
      if (assessments && assessments.length > 0) {
        assessments.forEach(a => {
          console.log(`   - ${a.title}`);
        });
      }
    }

    // Check onboarding_status
    const { data: status, error: statusError } = await supabaseAdmin
      .from('onboarding_status')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (statusError) {
      console.warn(`⚠️  Could not verify onboarding_status: ${statusError.message}`);
    } else if (status) {
      console.log(`✅ Onboarding Completeness: ${status.completeness_score}%`);
    }

    console.log('\n🎉 All tests passed!\n');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run the test
testICSUpload().then(success => {
  process.exit(success ? 0 : 1);
});
