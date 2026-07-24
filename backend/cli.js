/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║               JobPulse – Interactive CLI                     ║
 * ║  Run: node cli.js                                            ║
 * ║  Enter your details → Pipeline runs → Report prints here     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const readline = require('readline');

// ─── ANSI colours ────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m', bold:   '\x1b[1m', dim:   '\x1b[2m',
  red:    '\x1b[31m',green:  '\x1b[32m',yellow: '\x1b[33m',
  blue:   '\x1b[34m',cyan:   '\x1b[36m',
};
const bold  = (t) => `${C.bold}${t}${C.reset}`;
const cyan  = (t) => `${C.cyan}${t}${C.reset}`;
const green = (t) => `${C.green}${t}${C.reset}`;
const red   = (t) => `${C.red}${t}${C.reset}`;
const dim   = (t) => `${C.dim}${t}${C.reset}`;
const yellow= (t) => `${C.yellow}${t}${C.reset}`;
const LINE  = '─'.repeat(62);

// ─── Readline setup ───────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(q, (a) => res(a.trim())));

// ─── Prerequisite check ───────────────────────────────────────────
function checkEnv() {
  const missing = [];
  const provider = (process.env.AI_PROVIDER || 'groq').toLowerCase();

  if (provider === 'groq') {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      missing.push('GROQ_API_KEY');
    }
  } else if (provider === 'gemini') {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      missing.push('GEMINI_API_KEY');
    }
  } else if (provider === 'openai') {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      missing.push('OPENAI_API_KEY');
    }
  }

  if (!process.env.MONGO_URI) {
    missing.push('MONGO_URI');
  }
  return missing;
}

// ─── Main ─────────────────────────────────────────────────────────
(async () => {
  console.log('');
  console.log(cyan('╔══════════════════════════════════════════════════════════════╗'));
  console.log(cyan('║') + bold('        🚀  JobPulse – AI Job Tracker                         ') + cyan('║'));
  console.log(cyan('╚══════════════════════════════════════════════════════════════╝'));
  console.log('');

  // ── 0. Check API key ─────────────────────────────────────────
  const missing = checkEnv();
  if (missing.length > 0) {
    console.log(red('  ❌  Missing environment variables in backend/.env:'));
    missing.forEach((k) => console.log(yellow(`      → ${k}`)));
    if (missing.includes('GROQ_API_KEY')) {
      console.log('');
      console.log(bold('  How to get your free Groq API key:'));
      console.log(cyan('  1. Open: https://console.groq.com/keys'));
      console.log(cyan('  2. Click "Create API Key"'));
      console.log(cyan('  3. Copy the key (starts with gsk_...)'));
      console.log(cyan('  4. Open file: backend/.env'));
      console.log(cyan('  5. Replace:  GROQ_API_KEY=your_groq_api_key_here'));
      console.log(cyan('  6. With:     GROQ_API_KEY=gsk_... (your real key)'));
      console.log(cyan('  7. Re-run:   node cli.js'));
    }
    console.log('');
    rl.close();
    process.exit(1);
  }

  // ── 1. Connect to MongoDB ────────────────────────────────────
  process.stdout.write('  Connecting to MongoDB... ');
  try {
    const connectDB = require('./src/config/db');
    await connectDB();
    console.log(green('✅ Connected'));
  } catch (err) {
    console.log(red('❌ Failed'));
    console.log(red(`  Error: ${err.message}`));
    console.log(yellow('  → Make sure MongoDB Compass / MongoDB service is running'));
    rl.close();
    process.exit(1);
  }

  // ── 2. Collect user input ────────────────────────────────────
  console.log('');
  console.log(cyan(LINE));
  console.log(bold('  📝  Enter Your Job Preferences'));
  console.log(cyan(LINE));
  console.log(dim('  Press ENTER to use the [default] value shown in brackets'));
  console.log('');

  const name   = await ask(`  ${bold('Your Name')}          : `) || 'JobPulse User';
  const email  = await ask(`  ${bold('Your Email')}         : `) || `user_${Date.now()}@example.com`;

  console.log('');
  const DEFAULT_COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'NVIDIA', 'Adobe', 'Oracle'];
  const companiesRaw = await ask(
    `  ${bold('Company Name(s)')}    : ${dim('(optional – press Enter to search ALL top tech companies: Google, Microsoft, Amazon...)')} \n  → `
  );
  const companies = companiesRaw.trim()
    ? companiesRaw.split(',').map((c) => c.trim()).filter(Boolean)
    : DEFAULT_COMPANIES;

  const desiredRole = await ask(
    `\n  ${bold('Desired Job Role')}   : ${dim('(e.g. Software Engineer, Backend Developer)')} \n  → `
  ) || 'Software Engineer';

  const location = await ask(
    `\n  ${bold('Location Filter')}   : ${dim('(optional – e.g. Remote, India, USA – press Enter to skip)')} \n  → `
  ) || '';

  const experienceLevel = await ask(
    `\n  ${bold('Experience Level')}  : ${dim('(optional – e.g. Senior, Junior – press Enter to skip)')} \n  → `
  ) || '';

  console.log('');
  console.log(cyan(LINE));
  console.log(bold('  ⏱️   When do you want the report?'));
  console.log(dim('  [1] Run NOW  – Pipeline runs immediately and shows report'));
  console.log(dim('  [2] Schedule – Save preferences, report triggers at your chosen time daily'));
  console.log(cyan(LINE));
  const modeInput = await ask(`\n  Enter choice ${dim('[1 or 2, default: 1]')}: `) || '1';
  const runNow = modeInput.trim() !== '2';

  let notifyTime = '09:00';
  if (!runNow) {
    notifyTime = await ask(`\n  ${bold('Schedule Time')} ${dim('(HH:MM 24-hr format, e.g. 09:30 or 18:00)')}: `) || '09:00';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(notifyTime)) {
      console.log(yellow(`  ⚠️  Invalid time format. Using 09:00`));
      notifyTime = '09:00';
    }
  } else {
    // For "run now" mode, still store a notifyTime (defaults to current HH:MM)
    const { getCurrentHHMM } = require('./src/utils/timeUtils');
    notifyTime = getCurrentHHMM();
  }

  rl.close();

  // ── 3. Save preferences to MongoDB ──────────────────────────
  console.log('');
  console.log(cyan(LINE));
  console.log(bold('  💾  Saving Preferences to MongoDB...'));
  console.log(cyan(LINE));

  const userPreferenceAgent = require('./src/agents/userPreferenceAgent');
  const User = require('./src/models/User');

  let user;

  // Check if email already exists → update instead of duplicate
  const existing = await User.findOne({ email });
  if (existing) {
    user = await userPreferenceAgent.updateUser(existing._id, {
      name, companies, desiredRole,
      filters: { location: location || null, experienceLevel: experienceLevel || null },
      notifyTime, active: true,
    });
    console.log(yellow(`  ⚠️  Email already in DB → preferences updated`));
  } else {
    user = await userPreferenceAgent.createUser({
      name, email, companies, desiredRole,
      filters: { location: location || null, experienceLevel: experienceLevel || null },
      notifyTime,
    });
  }

  console.log('');
  console.log(green('  ✅  Saved to MongoDB ') + dim('(collection: users)'));
  console.log(`  ${dim('User ID   :')} ${user._id}`);
  console.log(`  ${dim('Name      :')} ${user.name}`);
  console.log(`  ${dim('Companies :')} ${user.companies.join(', ')}`);
  console.log(`  ${dim('Role      :')} ${user.desiredRole}`);
  console.log(`  ${dim('Location  :')} ${user.filters?.location || '(any)'}`);
  console.log(`  ${dim('Experience:')} ${user.filters?.experienceLevel || '(any)'}`);
  console.log(`  ${dim('Scheduled :')} ${user.notifyTime}`);

  // ── 4. Run pipeline now ──────────────────────────────────────
  if (runNow) {
    console.log('');
    console.log(cyan(LINE));
    console.log(bold('  🤖  Running Agent Pipeline Now...'));
    console.log(cyan(LINE));
    console.log(dim('  Agent 1 → Company Data Checker (cache check)'));
    console.log(dim('  Agent 2 → Search Agent        (Gemini finds careers URL)'));
    console.log(dim('  Agent 3 → Scraping Agent      (extracts job listings)'));
    console.log(dim('  Agent 4 → Job Filtering Agent (matches your role/location)'));
    console.log(dim('  Agent 5 → Report Generator    (prints report below)'));
    console.log(dim('  (First scrape takes 30–90 seconds. Subsequent runs use cache.)'));
    console.log('');

    const schedulerAgent = require('./src/agents/schedulerAgent');
    try {
      await schedulerAgent.processUser(user);
    } catch (err) {
      console.log('');
      console.log(red(`  ❌  Pipeline error: ${err.message}`));

      if (err.message.includes('GEMINI_API_KEY')) {
        console.log(yellow('  → Your Gemini API key is invalid or not set correctly in .env'));
      } else if (err.message.includes('net::ERR') || err.message.includes('timeout')) {
        console.log(yellow('  → Network error while scraping. Check your internet connection.'));
      }
    }
  } else {
    console.log('');
    console.log(cyan(LINE));
    console.log(green(`  ✅  Preferences saved! Report will run daily at ${bold(notifyTime)}`));
    console.log(dim('  Make sure "npm run dev" is running at that time.'));
    console.log(dim('  The scheduler checks every minute and will trigger automatically.'));
    console.log(cyan(LINE));
  }

  console.log('');
  // Gracefully close DB connection before exit (prevents Windows libuv crash)
  const mongoose = require('mongoose');
  await mongoose.disconnect();
  process.exit(0);
})();
