# Almoco Voting App

This project uses Google authentication for user sessions. Before running the server you must provide some environment variables.

## Required environment variables

Set these variables either in your shell or in a `.env` file at the project root:

- `GOOGLE_CLIENT_ID` – OAuth client ID from the Google developer console.
- `GOOGLE_CLIENT_SECRET` – OAuth client secret associated with the client ID.
- `SESSION_SECRET` – any random string used to sign the Express session cookie.

You will also need a MongoDB connection string in `MONGODB_URI` (not covered here).

## Google OAuth setup

Create an OAuth 2.0 Client ID in the Google developer console. Add the following authorized redirect URI:

```
http://localhost:3000/auth/google/callback
```

## Running the server

Install dependencies once with `npm install`. After setting the environment variables, start the server with:

```bash
npm start
```

The app will listen on port `3000` unless the `PORT` variable is defined.
