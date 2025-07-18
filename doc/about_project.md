# MovieApp

MovieApp is a full-stack web application for searching, viewing, and favoriting movies using the OMDb API. It features user authentication, favorites management, and a modern, responsive UI built with React and Tailwind CSS. The backend is built with Node.js, Express, and MongoDB.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Backend Overview](#backend-overview)
  - [Endpoints](#backend-endpoints)
  - [Key Functions](#backend-key-functions)
- [Frontend Overview](#frontend-overview)
  - [Main Components](#frontend-main-components)
  - [Key Functions](#frontend-key-functions)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [How It Works](#how-it-works)

---

## Features

- User registration and login (JWT-based)
- Search for movies by title, genre, cast, etc.
- View detailed movie information
- Add/remove movies to/from favorites (requires login)
- View your favorite movies and profile
- Responsive, modern UI with glassmorphism and neon effects
- Rate limiting, security headers, and caching for performance and security

---

## Project Structure

```
MovieApp/
  Backend/
    server.js           # Express backend server
    package.json
  Frontend/
    src/
      App.tsx           # Main React app
      main.tsx          # Entry point
      index.css         # Tailwind styles
    index.html
    package.json
  README.md
```

---

## Backend Overview

The backend is an Express server that provides a REST API for authentication, movie search, favorites, and user profile management. It connects to MongoDB for persistent storage.

### Backend Endpoints

- `POST /api/register` — Register a new user
- `POST /api/login` — Login with username/email and password
- `GET /api/favorites` — Get user's favorite movies (auth required)
- `POST /api/favorites` — Add a movie to favorites (auth required)
- `DELETE /api/favorites` — Remove a movie from favorites (auth required)
- `GET /api/profile` — Get user profile info (auth required)
- `POST /api/movies` — Batch fetch movie details by imdbIDs
- `GET /api/search` — Search for movies by query
- `GET /api/popular` — Get a list of popular movies (simulated)
- `GET /api/movie/:id` — Get detailed info for a movie by imdbID
- `GET /api/search-history` — Get recent search history (if DB connected)
- `GET /api/health` — Health check endpoint

### Backend Key Functions

- **connectToMongoDB**: Connects to MongoDB and sets a flag for DB-dependent features.
- **authenticateJWT**: Express middleware to verify JWT tokens for protected routes.
- **makeOMDBRequest**: Helper to fetch data from the OMDb API with error handling.
- **/api/register**: Registers a new user, hashes password, and stores in MongoDB.
- **/api/login**: Authenticates user by email/username and password, returns JWT.
- **/api/favorites**: CRUD operations for user's favorite movies (requires JWT).
- **/api/search**: Searches OMDb for movies, caches results, and stores search history.
- **/api/popular**: Simulates trending movies by running several OMDb searches.
- **/api/movie/:id**: Fetches detailed info for a single movie.
- **/api/search-history**: Returns recent search queries (if DB connected).
- **Error Handling**: Global error handler and 404 handler for API.

---

## Frontend Overview

The frontend is a React app using TypeScript, React Router, and Tailwind CSS. It communicates with the backend via REST API.

### Frontend Main Components

- **App.tsx**: Main application component, handles routing, state, and API calls.
- **MovieCard**: Displays a single movie with favorite button.
- **MovieModal**: Shows detailed info for a selected movie.
- **Pagination**: Handles pagination for search results.
- **FavoritesPage**: Displays user's favorite movies.
- **ProfilePage**: Shows user profile info.
- **UserMenu**: Dropdown for profile, favorites, and logout.
- **CombinedHeader**: Top navigation bar with search, login/register, and user menu.

### Frontend Key Functions

- **fetchFavorites**: Fetches the user's favorite movie IDs from the backend.
- **addFavorite**: Adds a movie to the user's favorites.
- **removeFavorite**: Removes a movie from the user's favorites.
- **fetchFavoriteMovies**: Fetches detailed info for all favorite movies.
- **fetchPopularMovies**: Loads a list of popular movies from the backend.
- **searchMovies**: Searches for movies by query and page.
- **handleSearch**: Handles the search form submission.
- **handlePageChange**: Changes the current search results page.
- **handleBackToPopular**: Returns to the popular movies view.
- **handleRegister**: Handles user registration.
- **handleLogin**: Handles user login.
- **handleLogout**: Logs the user out and clears local storage.

---

## Setup & Installation

### Backend

1. `cd Backend`
2. `npm install`
3. Create a `.env` file with:
   ```
   MONGODB_URI=your_mongodb_uri
   OMDB_API_KEY=your_omdb_api_key
   JWT_SECRET=your_jwt_secret
   PORT=6000
   ```
4. `npm start`

### Frontend

1. `cd Frontend`
2. `npm install`
3. `npm run dev`

---

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `OMDB_API_KEY`: Your OMDb API key (get from http://www.omdbapi.com/apikey.aspx)
- `JWT_SECRET`: Secret for signing JWT tokens
- `PORT`: Port for backend server (default: 6000)

---

## How It Works

1. **User Registration/Login**: Users can register and log in. Passwords are hashed and stored securely.
2. **JWT Authentication**: After login, a JWT token is stored in localStorage and sent with API requests.
3. **Movie Search**: Users can search for movies. Results are fetched from OMDb and cached for performance.
4. **Favorites**: Logged-in users can add/remove movies to/from their favorites, which are stored in MongoDB.
5. **Popular Movies**: The app simulates trending movies by searching for popular keywords.
6. **Profile**: Users can view their profile and favorite movies.
7. **Security**: The backend uses rate limiting, helmet for security headers, and input validation.

---

## Function-by-Function Explanation

### Backend (server.js)

- **connectToMongoDB**: Connects to MongoDB, logs status, and enables DB features.
- **authenticateJWT**: Middleware to check for a valid JWT in the Authorization header.
- **makeOMDBRequest**: Makes a GET request to the OMDb API, handles errors and timeouts.
- **/api/register**: Validates input, checks for existing user, hashes password, saves new user.
- **/api/login**: Finds user by email/username, checks password, returns JWT if valid.
- **/api/favorites (GET/POST/DELETE)**: Gets, adds, or removes favorite movies for the authenticated user.
- **/api/profile**: Returns the authenticated user's profile info.
- **/api/movies**: Batch fetches movie details for a list of imdbIDs.
- **/api/search**: Validates query, checks cache, fetches from OMDb, stores search history.
- **/api/popular**: Simulates trending movies by running several OMDb searches and combining results.
- **/api/movie/:id**: Fetches detailed info for a movie by imdbID.
- **/api/search-history**: Returns recent search queries from the database.
- **/api/health**: Returns server and database status.
- **Error Handling**: Catches and returns errors for all endpoints.

### Frontend (App.tsx and components)

- **MovieCard**: Renders a movie card with favorite/unfavorite button.
- **MovieModal**: Shows detailed info for a selected movie.
- **Pagination**: Renders pagination controls for search results.
- **FavoritesPage**: Lists all favorite movies for the user.
- **ProfilePage**: Displays the user's profile info.
- **UserMenu**: Dropdown for profile, favorites, and logout.
- **CombinedHeader**: Navigation bar with search, login/register, and user menu.
- **App**: Main component, manages state, handles routing, and API calls.
  - **fetchFavorites**: Loads favorite movie IDs for the logged-in user.
  - **addFavorite/removeFavorite**: Add or remove a movie from favorites.
  - **fetchFavoriteMovies**: Loads detailed info for all favorite movies.
  - **fetchPopularMovies**: Loads popular movies from the backend.
  - **searchMovies**: Searches for movies by query.
  - **handleSearch**: Handles search form submission.
  - **handlePageChange**: Changes the current page of search results.
  - **handleBackToPopular**: Returns to the popular movies view.
  - **handleRegister/handleLogin/handleLogout**: Handles user authentication.

---

## License

This project is for educational purposes.

---

If you need a more detailed breakdown of any specific function or file, let me know!