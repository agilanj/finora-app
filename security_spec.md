# FINORA Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every document across `users`, `accounts`, `transactions`, `categories`, `budgets`, `savings_goals`, `recurring_transactions`, `loans`, `cards`, `transit_trips`, `reminders`, `exports`, and `feedback` MUST carry `userId == request.auth.uid`. No user may read, list, create, update, or delete another user's records.
2. **Verified Identity**: All reads and writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Immutable Ownership & Creation Time**: `userId` and `createdAt` can never be changed after document creation; `createdAt == request.time` on create and `updatedAt == request.time` on both create and update.
4. **No Shadow / Ghost Fields**: Every `create` checks `data.keys().hasAll(...) && data.keys().hasOnly(...)`; every `update` uses action-based branches with `incoming().diff(existing()).affectedKeys().hasOnly(...)` wrapped by `isValid[Entity](incoming())`.
5. **Bounded Types & Sizes**: Every string enforces `.size()` bounds; numeric amounts on transactions, budgets, loans, goals, and transit logs enforce positive bounds (`amount > 0`). Document IDs match `^[a-zA-Z0-9_\-]+$` with length `<= 128`.
6. **PII Isolation**: `/users/{userId}` restricts `get`, `create`, `update`, `delete` exclusively to `request.auth.uid == userId`; `list` on `/users` is denied (`allow list: if false`).
7. **List Query Enforcement**: All collection `allow list` rules explicitly check `isSignedIn() && isEmailVerified() && resource.data.userId == request.auth.uid`, forcing clients to scope every query with `.where("userId", "==", uid)`.
8. **Terminal State Locking**: Settled loans (`status == "settled"`) and cancelled recurring transactions (`status == "cancelled"`) cannot be mutated once in terminal state.

## 2. Dirty Dozen Attack Payloads (Expected: PERMISSION_DENIED)
1. **Cross-User Read (`get`)**: Authenticated User B attempts `get(/accounts/acc_of_user_A)` -> Denied (`resource.data.userId != request.auth.uid`).
2. **Unscoped Collection Scrape (`list`)**: Authenticated User A executes `getDocs(collection(db, "transactions"))` without `where("userId", "==", uid)` -> Denied by `allow list`.
3. **User Directory Scraping (`list /users`)**: Authenticated User A attempts `getDocs(collection(db, "users"))` -> Denied (`allow list: if false`).
4. **Identity Spoofing on Create**: User A creates `/accounts/acc_fake` with `{ userId: "user_B", ... }` -> Denied (`incoming().userId == request.auth.uid` fails).
5. **Shadow / Ghost Field Injection**: User A creates `/transactions/tx_1` with extra field `isAdmin: true` -> Denied (`hasOnly(...)` rejects shadow keys).
6. **Value Poisoning on Update**: User A updates `/accounts/acc_1` changing `balance: "not_a_number"` -> Denied (`isValidAccount(incoming())` requires `number`).
7. **Timestamp Forgery**: User A creates `/transactions/tx_1` with backdated `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> Denied (`createdAt == request.time`).
8. **Immutable Field Mutation**: User A updates `/transactions/tx_1` attempting to reassign `userId: "user_B"` or alter `createdAt` -> Denied (`incoming().userId == existing().userId && incoming().createdAt == existing().createdAt`).
9. **Resource Exhaustion / ID Poisoning**: User A writes `/accounts/<1500-char-invalid-id!@#>` or injects a 500KB string in `description` -> Denied by `isValidId()` and `.size()` bounds.
10. **Unverified Email Access**: User with `email_verified: false` attempts to read or create `/accounts/acc_1` -> Denied (`isEmailVerified()` fails).
11. **Terminal State Bypass**: User A attempts to modify a settled loan (`existing().status == "settled"`) -> Denied by terminal state gate.
12. **Negative Amount / State Corruption**: User A creates `/transactions/tx_neg` with `amount: -5000` to inflate balance -> Denied (`data.amount > 0`).
