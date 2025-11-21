# Nord Dashboard - TODO

## High Priority

- [ ] **Add Firebase Firestore for Todo Persistence**

  - Set up Firebase project
  - Add Firebase SDK to project
  - Create Firestore database
  - Implement per-user todo storage (keyed by email from Google auth)
  - Add Firestore security rules to restrict users to their own data
  - Update TodoWidget to sync with Firestore instead of localStorage
  - Add offline support with Firestore's built-in caching

- [ ] **Switch Bible Widget from Gemini to OpenAI**
  - Replace Gemini API calls with OpenAI API
  - Update environment variables (VITE_OPENAI_API_KEY)
  - Test Bible quote generation with GPT-4
  - Remove Gemini dependencies

## Medium Priority

- [ ] Deploy to production hosting
- [ ] Add loading states for Firestore operations
- [ ] Add error handling for network failures
- [ ] Consider adding Bible widget Firestore persistence for query history

## Low Priority

- [ ] Add todo categories/tags
- [ ] Add todo due dates
- [ ] Add todo priority levels

## Notes

- Current setup uses localStorage (browser-only, no sync)
- Target: 2 users (you + girlfriend), separate data per user
- Firebase free tier: 1GB storage, 50K reads/day, 20K writes/day (more than enough)
