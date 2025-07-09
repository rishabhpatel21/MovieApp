# Movie Search Application

A full-stack movie search application built with React, Express, and MongoDB. The application allows users to search for movies using the OMDB API, view detailed movie information, and explore popular movies.

## Features

- **Movie Search**: Search for movies by title with Enter key trigger
- **Popular Movies**: Display trending movies on the landing page
- **Movie Details**: Detailed modal view with plot, cast, ratings, and awards
- **Pagination**: Navigate through search results with pagination
- **Search History**: Track search queries in MongoDB
- **Caching**: In-memory caching for improved performance
- **Responsive Design**: Works on all devices with beautiful UI
- **Error Handling**: User-friendly error messages and loading states

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Axios for API calls
- Lucide React for icons
- Vite for development

### Backend
- Node.js with Express
- MongoDB with Mongoose
- OMDB API integration
- In-memory caching with node-cache
- Rate limiting and security with Helmet
- Input validation with Joi

## Project Structure

```
├── Frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── vite-env.d.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── index.html
├── Backend/
│   ├── .env
│   ├── server.js
│   └── package.json
└── README.md
```

## Installation

1. Clone the repository
2. Install dependencies for both frontend and backend:

```bash
# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:

```
OMDB_API_KEY=your_api_key
MONGODB_URI=your_mongodb_uri
PORT=5000
```

4. Start MongoDB (make sure MongoDB is running on your system)

5. Run the application:

```bash
# Backend (from Backend directory)
npm run dev # or node server.js

# Frontend (from Frontend directory)
npm run dev
```

## API Endpoints

### Backend API

- `GET /api/search?query=<movie_title>&page=<page_number>` - Search for movies
- `GET /api/popular` - Get popular movies
- `GET /api/movie/:id` - Get detailed movie information
- `GET /api/search-history` - Get search history
- `GET /api/health` - Health check endpoint

## Features in Detail

### Search Functionality
- Real-time search with Enter key trigger
- Pagination support for large result sets
- Search history tracking in MongoDB
- Caching for improved performance

### Movie Details
- Complete movie information including plot, cast, director
- IMDB ratings and awards
- High-quality poster images with fallback
- Responsive modal design

### Popular Movies
- Curated list of trending movies
- Automatically displayed on landing page
- Smooth navigation between search and popular views

### Performance Optimizations
- In-memory caching for API responses
- Rate limiting to prevent abuse
- Optimized images with lazy loading
- Efficient database queries

## Security Features

- API key protection (not exposed to frontend)
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet for security headers

## Future Enhancements

- User authentication and personalized recommendations
- Watchlist functionality
- Movie reviews and ratings
- Advanced filtering and sorting options
- Real-time notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).