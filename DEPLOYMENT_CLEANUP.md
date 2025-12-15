# Deployment Cleanup Guide - Files to Delete Before Production

## 🗑️ Safe to Delete (Recommended)

### Development & Testing Files
```
backend/tests/                          # All test files
backend/email-notification-system/      # Email testing folder (if exists)
frontend/src/**/*.test.tsx              # Frontend test files
frontend/src/**/*.test.ts
frontend/src/**/*.spec.tsx
frontend/src/**/*.spec.ts
```

### Documentation & Notes (Keep in repo, exclude from deployment)
```
*.md                                    # Markdown documentation files
IMPLEMENTATION_*.md
OPTIMIZATION_*.md
PERFORMANCE_*.md
SITE_DELETION_FIX.md
README.md (keep in repo, not needed on server)
```

### Development Configuration
```
.history/                               # VS Code history
.vscode/                                # VS Code settings
.git/                                   # Git repository (deploy from build)
.gitignore
.prettierrc
.eslintrc.*
tsconfig.json (frontend - not needed after build)
vite.config.optimized.ts (if not in use)
```

### Build Artifacts (Clean before deployment)
```
frontend/node_modules/                  # Will reinstall on server
backend/node_modules/                   # Will reinstall on server
frontend/dist/                          # Old build (will rebuild)
```

### Temporary & Cache Files
```
*.log
*.tmp
.DS_Store
Thumbs.db
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

### Database Files (Don't deploy)
```
*.sql (except migration scripts if needed)
AEPTW.sql                              # Local database dump
AEPTW.zip                              # Backup file
```

### Scripts & Utilities (Optional - keep if needed)
```
backend/scripts/check_team_schema.js   # One-time migration
backend/scripts/create_evidence_table.js
backend/scripts/add_personnel_contact_fields.js
Fix types.ps1
role mapping.ps1
update-backgrounds.ps1
update-colors.ps1
quick-start.sh
```

---

## ✅ Must Keep (Required for Production)

### Backend Essential Files
```
backend/
├── src/                               # All source code
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
├── uploads/                           # User uploaded files
├── server.js                          # Main entry point
├── package.json                       # Dependencies
├── package-lock.json                  # Lock file
└── .env.production                    # Production environment (create new)
```

### Frontend Essential Files (After Build)
```
frontend/dist/                         # Production build output
```

OR if deploying source:
```
frontend/
├── src/                               # All source code
├── public/                            # Static assets
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts                     # Build configuration
└── .env.production                    # Production environment
```

---

## 📦 Deployment Package Structure

### Option 1: Built Frontend (Recommended)
```
amazon-eptw-production/
├── backend/
│   ├── src/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env.production
└── frontend/
    └── dist/                          # Built files only
```

### Option 2: Full Source (If building on server)
```
amazon-eptw-production/
├── backend/
│   ├── src/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env.production
└── frontend/
    ├── src/
    ├── public/
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

---

## 🚀 Deployment Checklist

### Before Deployment
- [ ] Build frontend: `cd frontend && npm run build`
- [ ] Test production build locally
- [ ] Create `.env.production` files
- [ ] Update database connection strings
- [ ] Update CORS origins
- [ ] Remove all `.env` files with sensitive data
- [ ] Run database optimization script
- [ ] Test all critical features

### Files to Create on Server
```
backend/.env.production
frontend/.env.production
```

### Environment Variables to Update
```env
# Backend .env.production
NODE_ENV=production
PORT=5000
DB_HOST=production-db-host
DB_USER=production-user
DB_PASSWORD=strong-password
DB_NAME=amazon_eptw_db
FRONTEND_URL=https://your-domain.com
JWT_SECRET=new-production-secret
```

```env
# Frontend .env.production
VITE_API_URL=https://api.your-domain.com
```

---

## 🔒 Security Checklist

### Remove Before Deployment
- [ ] All `.env` files with local credentials
- [ ] Test credentials and API keys
- [ ] Debug console.log statements (already removed in build)
- [ ] Development-only routes
- [ ] Sample/test data

### Verify Production Settings
- [ ] CORS configured for production domain only
- [ ] JWT secret is strong and unique
- [ ] Database credentials are secure
- [ ] File upload limits are appropriate
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced

---

## 📊 Estimated Size Reduction

| Category | Before | After | Savings |
|----------|--------|-------|---------|
| node_modules | ~500MB | 0 (reinstall) | 500MB |
| .git | ~100MB | 0 | 100MB |
| Documentation | ~5MB | 0 | 5MB |
| Test files | ~10MB | 0 | 10MB |
| Build artifacts | ~50MB | Clean | 50MB |
| **Total** | ~665MB | ~50MB | **92% reduction** |

---

## 🛠️ Deployment Commands

### Clean and Prepare
```bash
# Remove node_modules
rm -rf backend/node_modules frontend/node_modules

# Remove build artifacts
rm -rf frontend/dist

# Build frontend
cd frontend
npm install --production
npm run build

# Install backend dependencies
cd ../backend
npm install --production
```

### Create Deployment Package
```bash
# Create deployment folder
mkdir amazon-eptw-deploy

# Copy backend
cp -r backend/src amazon-eptw-deploy/backend/
cp backend/server.js amazon-eptw-deploy/backend/
cp backend/package.json amazon-eptw-deploy/backend/
cp -r backend/uploads amazon-eptw-deploy/backend/

# Copy frontend build
cp -r frontend/dist amazon-eptw-deploy/frontend/

# Create archive
tar -czf amazon-eptw-deploy.tar.gz amazon-eptw-deploy/
```

---

## ⚠️ Important Notes

1. **Never delete**:
   - `uploads/` folder (contains user data)
   - Database migration scripts (if you need to recreate DB)
   - `package.json` and `package-lock.json`

2. **Keep in Git, exclude from deployment**:
   - Documentation files
   - Development scripts
   - Test files

3. **Create fresh on server**:
   - `.env.production` files
   - SSL certificates
   - Log directories

4. **Backup before deployment**:
   - Database
   - Uploads folder
   - Current `.env` files (for reference)

---

## 📝 Quick Delete Commands

### Windows PowerShell
```powershell
# Delete development files
Remove-Item -Recurse -Force .git, .history, .vscode
Remove-Item -Recurse -Force backend/node_modules, frontend/node_modules
Remove-Item -Recurse -Force backend/tests
Remove-Item *.md -Exclude README.md
Remove-Item *.ps1
Remove-Item *.sql -Exclude optimize_database.sql
```

### Linux/Mac
```bash
# Delete development files
rm -rf .git .history .vscode
rm -rf backend/node_modules frontend/node_modules
rm -rf backend/tests
rm *.md
rm *.ps1
rm *.sql
```

---

**Final deployment package should be ~50-100MB (excluding node_modules)**
