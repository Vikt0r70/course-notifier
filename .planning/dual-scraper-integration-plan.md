# Plan: Dual Scraper Integration (Public + Student Portal)

> **Status:** Fully Implemented and Hardened in Production (Commit `bdf829d`).  
> **Key Maintenance Updates:** `PortalScraperService.ts` includes active DOM table clearing before submission, canonical course prefix-to-faculty verification (`COURSE_PREFIX_TO_FACULTY`), in-memory sync batch deduplication, and a scoped circuit breaker to eliminate cross-faculty ghost duplications.

## Problem Statement

The existing public scraper (`ScraperService.ts`) scrapes the university's public course schedule page. For the **summer semester 2025/2026**, this page is showing stale/empty data while the authenticated student portal (`eservices.zu.edu.jo`) contains the live, accurate course data.

**User Requirements:**
1. Add a second authenticated scraper for the student portal
2. Admin panel option to choose which scraper to use
3. Store portal credentials securely (environment variables or admin settings)
4. Ensure clean data transition when switching between scrapers
5. Maintain all existing functionality (notifications, watchlists, filters)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Scraper Orchestrator                       │
│  (Decides which scraper to run based on settings)           │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
    ┌──────────▼──────────┐      ┌──────────▼──────────┐
    │  Public Scraper     │      │  Portal Scraper     │
    │  (Existing)         │      │  (New)              │
    │  Course_Schedule.aspx│      │  eservices portal   │
    └──────────┬──────────┘      └──────────┬──────────┘
               │                              │
               └──────────────┬───────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  Database Sync     │
                    │  (Existing Logic)   │
                    │  Reused by both     │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │  PostgreSQL DB      │
                    │  courses table      │
                    └────────────────────┘
```

---

## Data Flow Analysis

### Current Flow (Public Scraper)

```
ScraperService.scrapeAll()
  ├── scrapeAll() 
  │     ├── Loop: Graduate (2 periods) + Bachelor (15 faculties × 2 periods)
  │     ├── Returns: ScrapedCourse[] array
  ├── syncDatabase(scrapedCourses)
  │     ├── Get existing courses from DB
  │     ├── Map existing by key: `${code}_${section}_${faculty}_${period}`
  │     ├── For each scraped course:
  │     │     ├── If exists: update if changed (status, name, room, etc.)
  │     │     ├── If new: create with firstOpenedAt
  │     ├── Remove courses no longer in scraped data
  │     └── Returns: {added, updated, removed}
  ├── Log results to ScraperLog
  └── Trigger notifications
```

### Key Database Fields Used for Matching
```typescript
const key = `${scraped.code}_${scraped.section}_${scraped.faculty}_${scraped.period}`;
```

**Note:** This key must be consistent between both scrapers.

---

## Implementation Plan

### Phase 1: Backend - Scraper Selection Infrastructure

#### 1.1 Add Scraper Source Setting

**File:** `server/src/models/SystemSetting.ts` (no changes needed - uses existing table)

**New settings to add (via migration or init):**
- `scraper_source`: `"public"` | `"portal"` (default: `"public"`)
- `portal_username`: Student ID for portal login
- `portal_password`: Portal password (encrypted server-side before storage)

> **Note:** No separate `portal_auto_sync` setting is needed — the existing `scraper_auto_sync` controls auto-sync regardless of which scraper source is selected. The scheduler uses the factory to pick the right scraper.

**File:** `server/src/config/index.ts`
Add environment variable loading:
```typescript
PORTAL_USERNAME: process.env.PORTAL_USERNAME || '',
PORTAL_PASSWORD: process.env.PORTAL_PASSWORD || '',
PORTAL_ENCRYPTION_KEY: process.env.PORTAL_ENCRYPTION_KEY || '',  // 32-byte hex key for AES-256
```

#### 1.2 Create Portal Scraper Service

**Refactored from:** `server/src/services/scraper/PortalScraper.ts` (existing standalone script)
**New File:** `server/src/services/scraper/PortalScraperService.ts`

> **Important:** A working `PortalScraper.ts` already exists with login flow, navigation, and course parsing. The new `PortalScraperService` should be refactored from this existing code — not written from scratch — and integrated with `syncDatabase()`, `ScraperLog`, `NotificationService`, and the `isRunning` guard.

```typescript
import { Course, ScraperLog } from '../../models';
import NotificationService from '../notification/NotificationService';

// Faculty name normalization map
// Portal names → Public scraper names (canonical)
// This ensures the matching key is consistent across both scrapers
const PORTAL_FACULTY_NORMALIZE: Record<string, string> = {
  'طب الاسنان': 'طب الأسنان',           // hamza difference
  // Add other mismatches here as discovered during testing
  // All other faculty names are identical between portal and public scraper:
  // 'الشريعة', 'الآداب', 'العلوم', 'الاقتصاد والعلوم الإدارية',
  // 'العلوم التربوية', 'الحقوق', 'العلوم الطبية المساندة', 'التمريض',
  // 'الهندسة التكنولوجية', 'وحدة متطلبات الجامعة', 'الصيدلة',
  // 'الفنون والتصميم', 'الإعلام', 'تكنولوجيا المعلومات'
};

function normalizeFacultyName(portalName: string): string {
  return PORTAL_FACULTY_NORMALIZE[portalName] || portalName;
}

class PortalScraperService {
  private isRunning = false;
  private browser: Browser | null = null;
  
  async scrapeAll(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Portal scraper already running, skipping...');
      return;
    }
    this.isRunning = true;
    
    const log = await ScraperLog.create({
      status: 'running',
      source: 'portal',  // Track which scraper ran
      startedAt: new Date(),
    });
    
    try {
      // 1. Get credentials (env vars first, then DB)
      // 2. Login to portal (reuse AuthenticatedScraper.login())
      // 3. Navigate to ActiveSchedual
      // 4. Loop through all faculties × study types
      // 5. Normalize faculty names via normalizeFacultyName()
      // 6. Call syncDatabase() with results (scoped to bachelor only)
      // 7. Call NotificationService.checkAndNotify()
      // 8. Update ScraperLog
    } finally {
      this.isRunning = false;
    }
  }
  
  isCurrentlyRunning(): boolean {
    return this.isRunning;
  }
}

export default new PortalScraperService();
```

**Key differences from public scraper:**
- Requires login with credentials
- Different URL: `/StudentPortal2/Home/ActiveSchedual`
- No dropdown for period (only StudyType: morning/evening)
- Status detected from text "مغلقة" in section column (not background color)
- Teaching method embedded in course code column
- Summer semester has 4-day patterns (`ح ن ث ر`)
- **Bachelor only** — does not scrape graduate programs (see §3.1)
- Faculty names are **normalized** to match the public scraper's canonical names

#### 1.3 Create Scraper Factory

**New File:** `server/src/services/scraper/ScraperFactory.ts`

Both `ScraperService` and `PortalScraperService` export singleton instances with the same interface (`scrapeAll(): Promise<void>`, `isCurrentlyRunning(): boolean`), so the factory returns the correct instance:

```typescript
import ScraperService from './ScraperService';
import PortalScraperService from './PortalScraperService';
import { SystemSetting } from '../../models';

interface IScraper {
  scrapeAll(): Promise<void>;
  isCurrentlyRunning(): boolean;
}

export async function getActiveScraper(): Promise<IScraper> {
  const sourceSetting = await SystemSetting.findOne({ 
    where: { key: 'scraper_source' } 
  });
  const source = sourceSetting?.value || 'public';
  
  if (source === 'portal') {
    return PortalScraperService;
  }
  return ScraperService;
}

export async function getActiveScraperSource(): Promise<'public' | 'portal'> {
  const sourceSetting = await SystemSetting.findOne({ 
    where: { key: 'scraper_source' } 
  });
  return (sourceSetting?.value as 'public' | 'portal') || 'public';
}
```

#### 1.4 Modify Runner

**File:** `server/src/services/scraper/runner.ts`

```typescript
import { getActiveScraper } from './ScraperFactory';

async function main() {
  const Scraper = await getActiveScraper();
  await Scraper.scrapeAll();
}
```

#### 1.5 Modify Admin Controller

**File:** `server/src/controllers/adminController.ts`

Update `runScraper()` to use the factory:
```typescript
export const runScraper = async (req: AuthRequest, res: Response) => {
  try {
    const Scraper = await getActiveScraper();
    Scraper.scrapeAll()
      .then(() => console.log('✅ Scraper run completed'))
      .catch((error) => console.error('❌ Scraper run failed:', error));

    res.json({
      success: true,
      message: 'Scraper started. This will take approximately 40 minutes.',
    });
  } catch (error: any) {
    console.error(error); res.status(500).json({ success: false, message: error.message });
  }
};
```

Update `getScraperStatus()` to include active source:
```typescript
export const getScraperStatus = async (req: AuthRequest, res: Response) => {
  const sourceSetting = await SystemSetting.findOne({ where: { key: 'scraper_source' } });
  const source = sourceSetting?.value || 'public';
  
  res.json({
    success: true,
    data: {
      isRunning,
      activeSource: source,  // <-- ADD THIS
      // ... rest
    },
  });
};
```

#### 1.6 Modify Scraper Scheduler

**File:** `server/src/services/scraper/ScraperScheduler.ts`

Update to use factory:
```typescript
this.task = cron.schedule(cronExpression, async () => {
  const Scraper = await getActiveScraper();
  await Scraper.scrapeAll();
});
```

---

### Phase 2: Frontend - Admin Panel Updates

#### 2.1 Add Scraper Source Selector

**File:** `client/src/pages/admin/AdminSettings.tsx`

In the "Scraper" tab, add:

```tsx
{/* Scraper Source Selection */}
<div className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
  <label className="block text-sm font-medium text-zinc-300 mb-3">
    Scraper Source
  </label>
  <div className="flex gap-3">
    <button
      onClick={() => updateSettingMutation.mutate({
        key: 'scraper_source',
        value: 'public',
      })}
      className={cn(
        'flex-1 p-3 rounded-lg border transition-all',
        settings?.scraper_source === 'public'
          ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-300'
      )}
    >
      <div className="font-medium">Public Website</div>
      <div className="text-xs mt-1 opacity-70">
        Scrapes zu.edu.jo (Course_Schedule.aspx)
      </div>
    </button>
    <button
      onClick={() => updateSettingMutation.mutate({
        key: 'scraper_source',
        value: 'portal',
      })}
      className={cn(
        'flex-1 p-3 rounded-lg border transition-all',
        settings?.scraper_source === 'portal'
          ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-300'
      )}
    >
      <div className="font-medium">Student Portal</div>
      <div className="text-xs mt-1 opacity-70">
        Scrapes eservices.zu.edu.jo (Authenticated)
      </div>
    </button>
  </div>
</div>

{/* Portal Credentials (only shown when portal is selected) */}
{settings?.scraper_source === 'portal' && (
  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
    <h3 className="text-sm font-medium text-amber-300 mb-3">
      Portal Credentials
    </h3>
    <div className="space-y-3">
      <Input
        placeholder="Student ID (e.g., 202305077)"
        value={portalUsername}
        onChange={(e) => setPortalUsername(e.target.value)}
      />
      <Input
        type="password"
        placeholder="Portal Password"
        value={portalPassword}
        onChange={(e) => setPortalPassword(e.target.value)}
      />
      <Button
        onClick={() => updateCredentialsMutation.mutate({
          username: portalUsername,
          password: portalPassword,
        })}
      >
        Save Credentials
      </Button>
      <Button
        variant="outline"
        onClick={() => testConnectionMutation.mutate()}
        disabled={testConnectionMutation.isLoading}
      >
        {testConnectionMutation.isLoading ? 'Testing...' : 'Test Connection'}
      </Button>
    </div>
    <p className="text-xs text-amber-400/70 mt-3">
      Credentials are encrypted server-side before storage.
    </p>
  </div>
)}
```

Also update the status display to show active source:
```tsx
<div className="flex items-center gap-3">
  <span className="text-sm text-zinc-400">
    Source: <span className="text-zinc-200 capitalize">{scraperStatus?.activeSource || 'public'}</span>
  </span>
</div>
```

#### 2.2 Add Frontend Service Methods

**File:** `client/src/services/adminService.ts`

Add:
```typescript
async getPortalCredentials() {
  const response = await api.get('/admin/portal-credentials');
  return response.data.data;
},

async updatePortalCredentials(credentials: { username: string; password: string }) {
  const response = await api.put('/admin/portal-credentials', credentials);
  return response.data;
},

async testPortalConnection() {
  const response = await api.post('/admin/portal/test-connection');
  return response.data;
},
```

---

### Phase 3: Data Consistency & Cleanup

#### 3.1 The Graduate Course Gap

The portal scraper **only handles bachelor programs** (15 faculties × 2 study types). It has no access to graduate programs (ماجستير, دبلوم عالي). The public scraper handles both.

**Problem:** `syncDatabase()` does a **full replace** — any existing course not found in the scraped data is **deleted**. If the portal scraper runs, it will delete all graduate courses because they won't appear in its results.

**Solution: Scoped Sync**

Modify `syncDatabase()` to accept a `scope` parameter. When the portal scraper runs, it only syncs/deletes courses within its scope (bachelor courses), leaving graduate courses untouched:

```typescript
// In PortalScraperService.syncDatabase():
// Only fetch existing bachelor courses for comparison
const existingCourses = await Course.findAll({
  where: { studyType: 'بكالوريوس' }
});
```

The public scraper continues to use `Course.findAll()` (no filter) since it covers all programs.

This means:
- Switching to portal → graduate courses stay in the DB unchanged (may become stale, but are preserved)
- Switching back to public → graduate courses resume being updated normally
- No data loss, no broken watchlists

#### 3.2 The Data Switch Problem

When switching from public → portal scraper:
- **Different course codes?** Portal shows `1501110 وجاهي` (code + method), public shows just `1501110`
- **Different faculty names?** Solved via `PORTAL_FACULTY_NORMALIZE` map (see §1.2)
- **Different periods?** Portal maps study type IDs `1`→`صباحي`, `2`→`مسائي` — matches public scraper
- **Section numbering?** Both extract numeric section, should be consistent

#### 3.3 Solution: Normalized Course Key

The existing key is:
```typescript
`${code}_${section}_${faculty}_${period}`
```

**For portal scraper, normalization is built-in (§1.2):**
- `code`: Extract numeric part only (remove "وجاهي", "مدمج", etc.) — already done in `parseCoursesFromPage()`
- `section`: Extract numeric part only (remove "مغلقة") — already done in `parseCoursesFromPage()`
- `faculty`: Normalized via `PORTAL_FACULTY_NORMALIZE` map — **solved**
- `period`: Mapped from study type names (`صباحي`/`مسائي`) — matches public scraper

#### 3.4 Data Cleanup Strategy

**Decision: Scoped Merge (Modified Option C)**

Use the existing `syncDatabase()` merge logic but scoped to each scraper's coverage:

| Scraper | Sync Scope | Deletes |
|---------|-----------|---------|
| Public | All courses (`Course.findAll()`) | Courses not found in public data |
| Portal | Bachelor only (`where: { studyType: 'بكالوريوس' }`) | Bachelor courses not found in portal data |

This is a minimal change to the existing `syncDatabase()` — just adding a `where` clause to the initial `findAll()`.

#### 3.5 Migration Path

**When admin switches scraper:**
1. Warn: "Switching to portal scraper will re-sync bachelor course data. Graduate courses will not be updated. This may take 10-15 minutes."
2. Trigger immediate scraper run
3. Scoped `syncDatabase()` will:
   - Update matching bachelor courses
   - Add new bachelor courses  
   - Remove bachelor courses not found in portal data
   - **Leave graduate courses untouched**
4. Watchlists are preserved (they reference course_code + section)

---

### Phase 4: Database Changes

#### 4.1 Add Source Column to Courses (Optional but Recommended)

**Migration:** `server/migrations/add-scraper-source.sql`

```sql
-- Add source column to courses to track which scraper added the course
ALTER TABLE courses ADD COLUMN source VARCHAR(50) DEFAULT 'public';
CREATE INDEX idx_courses_source ON courses(source);

-- Add source column to scraper_logs to track which scraper ran
ALTER TABLE scraper_logs ADD COLUMN source VARCHAR(50) DEFAULT 'public';
```

**Model Update:** `server/src/models/Course.ts`

```typescript
source: {
  type: DataTypes.STRING(50),
  defaultValue: 'public',
},
```

**Model Update:** `server/src/models/ScraperLog.ts`

```typescript
source: {
  type: DataTypes.STRING(50),
  defaultValue: 'public',
},
```

> This lets the admin see in the scraper logs which scraper produced each run, making debugging much easier.

#### 4.2 Add Portal Settings

No schema changes needed - uses existing `system_settings` table.

---

### Phase 5: Security

#### 5.1 Credential Storage

**Option A: Environment Variables (Simple)**
- Store in `.env` file
- Pros: Standard approach, works with Docker
- Cons: Requires server restart to change

**Option B: Database (Flexible)**
- Store in `system_settings` table
- Encrypt password before storage
- Pros: Admin can change without restarting server
- Cons: Slightly more complex

**Recommendation: Both**
- Check `.env` first (for Docker deployment)
- Fallback to database settings (for runtime changes)
- Priority: `.env` > database

#### 5.2 Encryption

Use AES-256-CBC with a random IV (initialization vector) for each encryption. **Do not use the deprecated `crypto.createCipher()`** — it was removed in modern Node.js.

**New File:** `server/src/utils/encryption.ts`

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.PORTAL_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      'PORTAL_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(key, 'hex');
}

export function encryptPassword(password: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptPassword(encryptedText: string): string {
  const key = getEncryptionKey();
  const [ivHex, encrypted] = encryptedText.split(':');
  if (!ivHex || !encrypted) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**Key points:**
- Each encryption generates a unique random IV, prepended to the ciphertext as `iv:encrypted`
- The encryption key is a 32-byte hex string stored in `PORTAL_ENCRYPTION_KEY` env var
- Generate a key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

#### 5.3 Dedicated Credential Endpoint

**Do not** use the generic `updateSettings()` for credentials. Create a dedicated endpoint that encrypts server-side:

**File:** `server/src/controllers/adminController.ts` (add)

```typescript
// PUT /admin/portal-credentials
export const updatePortalCredentials = async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;
  
  if (username) {
    await SystemSetting.upsert({ key: 'portal_username', value: username });
  }
  if (password) {
    const encrypted = encryptPassword(password);
    await SystemSetting.upsert({ key: 'portal_password', value: encrypted });
  }
  
  res.json({ success: true, message: 'Portal credentials updated' });
};

// GET /admin/portal-credentials
export const getPortalCredentials = async (req: AuthRequest, res: Response) => {
  const username = await SystemSetting.findOne({ where: { key: 'portal_username' } });
  const hasPassword = await SystemSetting.findOne({ where: { key: 'portal_password' } });
  
  res.json({
    success: true,
    data: {
      username: username?.value || '',
      hasPassword: !!hasPassword?.value,  // Never return the actual password
    },
  });
};
```

#### 5.4 Test Connection Endpoint

Allow admins to verify portal credentials work before switching:

**File:** `server/src/controllers/adminController.ts` (add)

```typescript
// POST /admin/portal/test-connection
export const testPortalConnection = async (req: AuthRequest, res: Response) => {
  try {
    // Get credentials from env or DB
    const credentials = await getPortalCredentials();
    if (!credentials.username || !credentials.password) {
      return res.status(400).json({
        success: false,
        message: 'Portal credentials not configured',
      });
    }
    
    // Attempt login only (no scraping)
    const scraper = new AuthenticatedScraper();
    await scraper.testLogin(credentials.username, credentials.password);
    
    res.json({ success: true, message: 'Portal connection successful' });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: `Connection failed: ${error.message}`,
    });
  }
};
```

**Note:** For production, use a proper key management system.

---

### Phase 6: Testing Strategy

#### 6.1 Test Cases

1. **Switch public → portal**
   - Set `scraper_source = 'portal'`
   - Provide valid credentials
   - Run scraper
   - Verify bachelor courses are updated
   - Verify **graduate courses are NOT deleted** (scoped sync)
   - Verify watchlists still work

2. **Switch portal → public**
   - Set `scraper_source = 'public'`
   - Run scraper
   - Verify all courses (bachelor + graduate) are updated
   - Verify no portal credentials needed

3. **Invalid portal credentials**
   - Set wrong password
   - Use "Test Connection" button → verify clear error
   - Run scraper → verify graceful error handling
   - Verify scraper log shows failure with `source: 'portal'`

4. **Missing portal credentials**
   - Set `scraper_source = 'portal'`
   - Don't provide credentials
   - Run scraper
   - Verify clear error message

5. **Test Connection**
   - Save valid credentials → Test Connection → verify success
   - Save invalid credentials → Test Connection → verify error message
   - No credentials saved → Test Connection → verify "not configured" message

6. **Data consistency**
   - Scrape with public
   - Switch to portal
   - Verify bachelor course count is reasonable
   - Verify graduate courses unchanged
   - Verify open/closed counts make sense

7. **Faculty name normalization**
   - Run portal scraper
   - Verify `طب الأسنان` courses match correctly (not duplicated)
   - Check all 15 faculty names in DB match expected canonical names

---

### Phase 7: Implementation Order

#### Week 1: Backend Core
1. Refactor `PortalScraper.ts` → `PortalScraperService.ts` (integrate with syncDatabase, ScraperLog, NotificationService)
2. Create `server/src/utils/encryption.ts`
3. Create `ScraperFactory.ts`
4. Modify `runner.ts` to use factory
5. Modify `adminController.ts` to use factory + add credential & test-connection endpoints
6. Modify `admin.ts` routes for new endpoints
7. Test standalone portal scraper

#### Week 2: Frontend & Integration
1. Update `AdminSettings.tsx` with scraper selector
2. Add portal credentials UI with Test Connection button
3. Update admin service with new methods
4. Add source display to scraper status
5. Test switching between scrapers

#### Week 3: Data Consistency & Polish
1. Run migration: `source` column on courses + scraper_logs
2. Implement scoped syncDatabase for portal scraper
3. Verify faculty name normalization with real portal data
4. Add data cleanup warning dialog
5. Add comprehensive error handling
6. Test all scenarios (see §6.1)
7. Update documentation

---

### Phase 8: Files to Create/Modify

#### New Files
- `server/src/services/scraper/PortalScraperService.ts` (refactored from `PortalScraper.ts`)
- `server/src/services/scraper/ScraperFactory.ts`
- `server/src/utils/encryption.ts`
- `server/migrations/add-scraper-source.sql`

#### Modified Files
- `server/src/services/scraper/runner.ts`
- `server/src/services/scraper/ScraperScheduler.ts`
- `server/src/controllers/adminController.ts`
- `server/src/routes/admin.ts`
- `server/src/models/Course.ts`
- `server/src/models/ScraperLog.ts`
- `server/src/config/index.ts`
- `server/.env.example`
- `client/src/pages/admin/AdminSettings.tsx`
- `client/src/services/adminService.ts`

#### May Be Removed After Refactoring
- `server/src/services/scraper/PortalScraper.ts` (standalone script → absorbed into PortalScraperService)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Portal blocks automated login | Medium | High | Add delays, use headless browser, respect rate limits |
| Course codes differ between sources | Medium | High | Normalize codes before storing, test with real data |
| Faculty name mismatch (Arabic diacritics) | Medium | High | **Solved:** `PORTAL_FACULTY_NORMALIZE` map (see §1.2) |
| Watchlists break after switch | Low | High | Scoped sync preserves data, test thoroughly |
| Graduate courses lost on portal switch | Medium | High | **Solved:** Scoped `syncDatabase()` only deletes bachelor courses (see §3.1) |
| Credentials leak | Low | Critical | Encrypted server-side with AES-256-CBC, never returned via API |
| Summer semester day patterns break filters | Medium | Medium | Update frontend day filter logic |
| Public scraper permanently blocked | High | Medium | Keep as fallback, implement portal scraper |

---

## Success Criteria

- [ ] Admin can switch between public and portal scraper from UI
- [ ] Portal scraper successfully logs in and scrapes courses
- [ ] Data syncs correctly when switching sources
- [ ] Graduate courses preserved when using portal scraper (scoped sync)
- [ ] Faculty names normalized — no duplicates across scrapers
- [ ] Watchlists remain functional after switch
- [ ] Existing notifications system works with portal data
- [ ] Summer semester day patterns (4 days) are handled correctly
- [ ] Credentials are encrypted server-side (AES-256-CBC with IV)
- [ ] Test Connection button validates credentials before switching
- [ ] ScraperLog records which source ran each scrape
- [ ] Both scrapers can coexist and be toggled at will

---

## Notes

### Day Pattern Differences

**Regular Semester:**
- `أ ر` = 2 days (Sunday + Wednesday)
- `ن خ` = 2 days (Monday + Thursday)
- `ح ث` = 2 days (Saturday + Tuesday)

**Summer Semester:**
- `ح ن ث ر` = 4 days (Saturday + Sunday + Tuesday + Thursday)

The frontend day filter must handle both 2-day and 4-day patterns.

### Teaching Method Mapping

| Portal Value | Public Value | Description |
|-------------|-------------|-------------|
| `وجاهي` | `وجاهي` | Traditional in-person |
| `مدمج` | `مدمج` | Blended (in-person + online) |
| `الكتروني كامل` | `الكتروني` | Fully online |

### Faculty Name Normalization (Verified)

Compared faculty names between [ScraperService.ts](file:///D:/Projects/Course-Notifier/server/src/services/scraper/ScraperService.ts) (lines 54-70) and [PortalScraper.ts](file:///D:/Projects/Course-Notifier/server/src/services/scraper/PortalScraper.ts) (lines 36-52):

| ID | Public Scraper (canonical) | Portal Scraper | Match? |
|----|---------------------------|----------------|--------|
| 01 | `الشريعة` | `الشريعة` | ✅ |
| 02 | `الآداب` | `الآداب` | ✅ |
| 03 | `العلوم` | `العلوم` | ✅ |
| 04 | `الاقتصاد والعلوم الإدارية` | `الاقتصاد والعلوم الإدارية` | ✅ |
| 05 | `العلوم التربوية` | `العلوم التربوية` | ✅ |
| 06 | `الحقوق` | `الحقوق` | ✅ |
| 07 | `العلوم الطبية المساندة` | `العلوم الطبية المساندة` | ✅ |
| 08 | `التمريض` | `التمريض` | ✅ |
| 09 | `الهندسة التكنولوجية` | `الهندسة التكنولوجية` | ✅ |
| 10 | `وحدة متطلبات الجامعة` | `وحدة متطلبات الجامعة` | ✅ |
| 11 | `الصيدلة` | `الصيدلة` | ✅ |
| 12 | `الفنون والتصميم` | `الفنون والتصميم` | ✅ |
| 14 | `الإعلام` | `الإعلام` | ✅ |
| 15 | `تكنولوجيا المعلومات` | `تكنولوجيا المعلومات` | ✅ |
| 16 | `طب الأسنان` | `طب الاسنان` | ❌ Hamza difference → normalized in `PORTAL_FACULTY_NORMALIZE` |

Only **one mismatch** confirmed: faculty 16 (`طب الأسنان` vs `طب الاسنان`). Handled by the normalization map in §1.2.

---

**Plan created:** 2026-05-26
**Plan updated:** 2026-05-30 — Fixed scoped sync, faculty normalization, crypto API, credential security, test connection
**For:** Course Notifier v2.0 - Dual Scraper Integration
