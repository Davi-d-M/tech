# Implementation Plan - Master Omni-Channel Migration Fix 🛠️🔌

This plan resolves the SQL "relation does not exist" error by consolidating all social and omni-channel infrastructure into a single, idempotent "Master Backbone" migration. This ensures all tables and security policies are created in the correct order.

## User Review Required

> [!IMPORTANT]
> I am combining the definitions from the `phase2_expansion` and `omni_channel_backbone` migrations to ensure `social_accounts` is defined before it is referenced by `publishing_jobs`.

## Proposed Changes

### 1. Database Consolidation (`supabase/migrations/`) 🗄️
- [NEW] `20260914_omni_channel_master_sync.sql`:
    - Define `social_accounts` (Connected Nodes).
    - Define `content_library` (Master Content).
    - Define `publishing_jobs` (The Queue).
    - Define `social_posts` (Live Posts).
    - Define all RLS policies with `DROP POLICY IF EXISTS` to prevent duplicate errors.
- [DELETE] `20260914_omni_channel_backbone.sql` (Obsolete).
- [DELETE] `20260910_apex_os_phase2_expansion.sql` (Obsolete).

---

## Verification Plan

### Automated Tests
- Run the new SQL script in the Supabase SQL Editor.
- Verify that it completes with "Success" and all tables are visible in the Database schema.

### Manual Verification
1. **Infrastructure Test**: Go to **Admin > Social Hub > Infrastructure** -> Verify that connecting a platform (like Instagram) works without database errors.
2. **Composer Test**: Create a post and click "Publish" -> Verify a job is created in the `publishing_jobs` table.
