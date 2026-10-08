# Firebase setup

Setup and deployment instructions now live in [README.md](README.md).

> The previous version of this file described injecting `GEMINI_API_KEY` into the frontend
> build. Don't do that: the key belongs in Firebase Functions secrets
> (`firebase functions:secrets:set GEMINI_API_KEY`), where only the `generateReport` function can read it.
