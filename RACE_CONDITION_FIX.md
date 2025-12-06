# Todo Database Race Condition Fix

## The Problem

Your Firebase todo database was getting "nuked" due to **multiple race conditions** in the todo synchronization logic.

### Race Condition #1: Auto-Save Effect Conflict

**Location**: `TodoWidget.tsx` lines 48-59 (old code)

**What was happening**:

1. User logs in → `subscribeTodos` fetches data from Firestore
2. Firestore returns todos → `setTodos(firestoreTodos)` is called
3. This triggers the auto-save effect because `todos` state changed
4. The effect saves the data back to Firestore (unnecessary write)
5. If the user performs an action (add/delete/toggle) at the same time:
   - The subscription update triggers a save
   - The user action triggers a save
   - Both saves happen simultaneously
   - One overwrites the other → **data loss**

**The fix**:

- Removed the auto-save effect entirely
- The subscription is now **read-only**
- Saves only happen on explicit user actions (add, toggle, delete)

### Race Condition #2: Read-Modify-Write Pattern

**Location**: `todoService.ts` - `addTodo`, `updateTodo`, `deleteTodo` functions

**What was happening**:

```typescript
// OLD CODE (DANGEROUS)
const docSnap = await getDoc(userDocRef); // 1. Read
const currentTodos = docSnap.data().todos || []; // 2. Get current data
const updatedTodos = [...currentTodos, newTodo]; // 3. Modify
await updateDoc(userDocRef, { todos: updatedTodos }); // 4. Write
```

**The problem**:

- Between steps 1 and 4, another operation could modify the database
- Example scenario:
  1. User clicks "add todo A" → reads current todos: `[]`
  2. User quickly clicks "add todo B" → reads current todos: `[]` (before A is saved)
  3. First operation writes: `[A]`
  4. Second operation writes: `[B]` → **Todo A is lost!**

**The fix**:

- Replaced with **Firestore transactions** using `runTransaction`
- Transactions are atomic - they retry automatically if data changes
- Firestore guarantees that all operations in a transaction see a consistent snapshot

```typescript
// NEW CODE (SAFE)
await runTransaction(db, async (transaction) => {
  const docSnap = await transaction.get(userDocRef);
  const currentTodos = docSnap.data().todos || [];
  transaction.update(userDocRef, {
    todos: [...currentTodos, todo],
  });
});
```

## Changes Made

### 1. `services/todoService.ts`

- ✅ Added `runTransaction` import from Firestore
- ✅ Wrapped `addTodo` in a transaction
- ✅ Wrapped `updateTodo` in a transaction
- ✅ Wrapped `deleteTodo` in a transaction

### 2. `components/TodoWidget.tsx`

- ✅ Removed the auto-save effect (lines 45-59)
- ✅ Updated imports to use `addTodo`, `updateTodo`, `deleteTodo` functions
- ✅ Made `handleAdd` async and call `addTodo(userEmail, newTodo)`
- ✅ Made `toggleTodo` async and call `updateTodo(userEmail, id, updates)`
- ✅ Made `deleteTodo` async and call `deleteTodoFromFirestore(userEmail, id)`
- ✅ Removed local state updates - the real-time subscription handles UI updates

## How It Works Now

### Data Flow (Correct)

1. User performs action (add/toggle/delete)
2. Action handler calls Firestore transaction function
3. Transaction executes atomically in Firestore
4. Firestore confirms the change
5. Real-time subscription (`onSnapshot`) detects the change
6. Subscription callback updates local state
7. UI re-renders with new data

### Key Benefits

- ✅ **No race conditions**: Transactions are atomic
- ✅ **No duplicate saves**: Only explicit actions trigger saves
- ✅ **Automatic UI updates**: Real-time subscription keeps UI in sync
- ✅ **Data integrity**: Firestore guarantees consistency
- ✅ **Concurrent operations**: Multiple users can edit simultaneously

## Testing Recommendations

1. **Rapid clicking**: Try adding multiple todos very quickly
2. **Multi-tab**: Open the app in two tabs, edit todos in both
3. **Network latency**: Throttle network in DevTools, perform actions
4. **Logout/login**: Verify todos persist correctly across sessions

## Additional Notes

- The `hasLoadedFromFirestore` ref is now only used to prevent showing stale data
- Error handling is in place for failed operations (logged to console)
- Input field clears immediately for better UX, even before Firestore confirms
- All Firestore operations are now properly awaited
