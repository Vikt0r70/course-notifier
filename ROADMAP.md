# Course Notifier Roadmap

## Phase 0: Bug Fixes (Develop Branch)

- [ ] Remove notification button from top-left header
- [ ] Fix watchlist instant refresh when adding courses
- [ ] Fix watchlist instant refresh when deleting courses
- [ ] Remove Save button from global notification settings (already auto-saves)
- [ ] Sync Dashboard and Watchlist views (changes reflect in both instantly)

---

## Phase 1: Android App

- [ ] Complete React Native app structure
- [ ] Share API services with web app
- [ ] Implement authentication flow
- [ ] Course browsing and search
- [ ] Watchlist management
- [ ] FCM push notifications
- [ ] Create Privacy Policy page
- [ ] **In-app updates (OTA)** - Update app without Play Store
  - [ ] Integrate CodePush or Expo Updates
  - [ ] Server-side update management
  - [ ] Version checking on app launch
  - [ ] Download and apply updates silently

---

## Phase 2: PWA Enhancement (Free iOS Alternative)

- [ ] Add service worker for offline support
- [ ] Add web app manifest for installability
- [ ] Add "Add to Home Screen" prompt
- [ ] Test on iOS Safari
- [ ] Optimize for mobile viewport

---

## Phase 3: Plugin Architecture

- [ ] Design plugin interface/contract
- [ ] Create plugin loader system
- [ ] Refactor Zarqa scraper as first plugin
- [ ] Database changes (data_sources table)
- [ ] Modify Course model for multi-source
- [ ] Admin UI for plugin management
- [ ] Documentation for creating plugins

---

## Phase 4: AI-Assisted Integration

- [ ] AI tool to analyze university website structure
- [ ] Auto-generate plugin scaffolding
- [ ] Sandbox for testing generated scrapers
- [ ] Admin review and approval workflow

---

## Phase 5: Multi-University Expansion

- [ ] Docker Compose packaging for self-hosting
- [ ] Installation documentation
- [ ] Partner with other universities
- [ ] Create plugins for each new university

---

## Additional Improvements

| Category | Task |
|----------|------|
| Performance | Code splitting to reduce bundle size |
| Testing | Add E2E tests with Playwright |
| CI/CD | GitHub Actions for automated deployment |
