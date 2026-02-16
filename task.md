- [x] Implement Tenant Identity Resolution <!-- id: 0 -->
    - [x] Update `POST /api/auth/login` to use `findMany` and check for duplicates <!-- id: 1 -->
    - [x] Update `POST /api/auth/forgot-password` to use `findMany` and check for duplicates <!-- id: 2 -->
    - [x] Verify changes with manual review <!-- id: 3 -->

# Task: Fix Tenant Isolation Leaks

- [x] Fix Tenant Isolation Leaks <!-- id: 4 -->
    - [x] Fix Global Data Leak in `GET /api/admin/users` <!-- id: 5 -->
    - [x] Fix Hardcoded Tenant in `GET /api/admin/roles` <!-- id: 6 -->
    - [x] Verify changes <!-- id: 7 -->

# Task: DMS Audit & Share Fixes (Post-Verification)

- [x] Fix Audit Page "Entity" Column Display <!-- id: 8 -->
    - [x] Add missing `entityType`, `entityId`, `metadata` to `FolderService` (create/update/delete) <!-- id: 9 -->
    - [x] Add missing `entityType`, `entityId`, `metadata` to `DocumentService` (update/delete) <!-- id: 10 -->
    - [x] Add missing `entityType`, `entityId`, `metadata` to `VersionService` & `ShareService` <!-- id: 11 -->
- [x] Fix Version Upload Timeout (P2028) <!-- id: 12 -->
    - [x] Increase transaction timeout to 20s in `VersionService` <!-- id: 13 -->
- [x] Fix Share Link Creation Error <!-- id: 14 -->
    - [x] Rename `accessKey` to `token` in `ShareService` to match Schema <!-- id: 15 -->
    - [x] Update `ShareDocumentModal` to use `token` from API response <!-- id: 16 -->
