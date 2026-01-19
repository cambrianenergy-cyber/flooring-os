# Square Flooring Pro Suite Security & Access Control

## User Roles

### Founder (Unlimited Access)
- **Emails**: 
  - financialgrowthdfw@gmail.com
  - cambrianenergy@gmail.com
- **Access**: Full access to all features and data
- **Badge**: 👑 Founder badge displays on all pages
- **Backend**: All Firestore operations allowed

### Regular Users
- **Access**: Limited to company-level data (to be implemented)
- **Firestore**: Can only read/write to their assigned company's documents

## Security Implementation

### Frontend Security
1. **AuthGuard Component** (`src/components/AuthGuard.tsx`)
   - Protects all routes under `/app`
   - Redirects unauthenticated users to `/login`
   - Displays founder badge for authorized emails
   - Located in `src/lib/auth-utils.ts`

2. **Email-based Founder Check** (`src/lib/auth-utils.ts`)
   - `isFounder(email)` - Returns true if email matches founder list
   - `getAccessLevel(email)` - Returns access tier

### Backend Security (Firestore Rules)
1. **Authentication Required**
   - All operations require `request.auth.uid` to be set
   - Anonymous access is blocked

2. **Collection-Level Rules** (see `firestore.rules`)
   - `/users/{userId}` - Users can only read their own document
   - `/appointments/{doc}` - Authenticated users can read/write
   - `/dev_smoke_tests/{doc}` - Only founders can read results

3. **To Deploy Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

## Future Enhancements

- [ ] Multi-tenant support (company_id on all documents)
- [ ] Role-based access control (admin, manager, technician)
- [ ] Rate limiting on Firestore operations
- [ ] Audit logging for sensitive operations
- [ ] Row-level security based on company assignments
