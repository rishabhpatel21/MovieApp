import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import Joi from 'joi';
import NodeCache from 'node-cache';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

// Initialize cache with 1 hour TTL
const cache = new NodeCache({ stdTTL: 3600 });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// MongoDB connection with error handling
let isMongoConnected = false;

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movieapp', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    isMongoConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.warn('MongoDB connection failed, running without database features:', error.message);
    isMongoConnected = false;
  }
};

// Attempt to connect to MongoDB
connectToMongoDB();

// Search History Schema
const searchHistorySchema = new mongoose.Schema({
  query: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  results: { type: Number, default: 0 },
  userIP: String
});

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true }, // hashed
  favorites: [{ type: String }] // Array of imdbIDs
});
const User = mongoose.model('User', userSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ success: false, error: 'Email, username, and password required.' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, username, password: hashedPassword, favorites: [] });
    await user.save();
    res.json({ success: true, message: 'User registered successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Registration failed.' });
  }
});

// Login endpoint (username or email)
app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Username/email and password required.' });
    }
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, username: user.username });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Login failed.' });
  }
});

// JWT Auth Middleware
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token.' });
  }
}

// Get favorites
app.get('/api/favorites', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get favorites.' });
  }
});

// Add favorite
app.post('/api/favorites', authenticateJWT, async (req, res) => {
  try {
    const { imdbID } = req.body;
    if (!imdbID) return res.status(400).json({ success: false, error: 'imdbID required.' });
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    if (!user.favorites.includes(imdbID)) {
      user.favorites.push(imdbID);
      await user.save();
    }
    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add favorite.' });
  }
});

// Remove favorite
app.delete('/api/favorites', authenticateJWT, async (req, res) => {
  try {
    const { imdbID } = req.body;
    if (!imdbID) return res.status(400).json({ success: false, error: 'imdbID required.' });
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    user.favorites = user.favorites.filter(id => id !== imdbID);
    await user.save();
    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to remove favorite.' });
  }
});

// Profile endpoint (new)
app.get('/api/profile', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to get profile.' });
  }
});

// POST /api/movies - Batch fetch movies by imdbIDs
app.post('/api/movies', async (req, res) => {
  const { imdbIDs } = req.body;
  if (!Array.isArray(imdbIDs)) {
    return res.status(400).json({ success: false, error: 'imdbIDs must be an array.' });
  }
  try {
    const movies = [];
    for (const imdbID of imdbIDs) {
      const apiUrl = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${encodeURIComponent(imdbID)}`;
      const data = await makeOMDBRequest(apiUrl);
      if (data.Response === 'True') {
        movies.push(data);
      }
    }
    res.json({ success: true, movies });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch movies.' });
  }
});

// Validation schemas
const searchSchema = Joi.object({
  query: Joi.string().min(1).max(100).required(),
  page: Joi.number().integer().min(1).max(100).default(1)
});

// Helper function to make OMDB API requests
const makeOMDBRequest = async (url) => {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Movie-Search-App/1.0'
      }
    });
    return response.data;
  } catch (error) {
    console.error('OMDB API Error:', error.message);
    throw new Error('Failed to fetch data from movie database');
  }
};

// GET /api/search - Search for movies
app.get('/api/search', async (req, res) => {
  try {
    const { error, value } = searchSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { query, page } = value;
    const cacheKey = `search:${query}:${page}`;
    
    // Check cache first
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const apiUrl = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=${encodeURIComponent(query)}&page=${page}`;
    const data = await makeOMDBRequest(apiUrl);

    let response;
    if (data.Response === 'True') {
      // Get detailed info for each movie
      const moviesWithDetails = await Promise.all(
        data.Search.map(async (movie) => {
          const detailUrl = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${movie.imdbID}`;
          try {
            const detailData = await makeOMDBRequest(detailUrl);
            return {
              ...movie,
              Plot: detailData.Plot,
              Director: detailData.Director,
              Actors: detailData.Actors,
              Genre: detailData.Genre,
              Runtime: detailData.Runtime,
              imdbRating: detailData.imdbRating,
              Awards: detailData.Awards
            };
          } catch (error) {
            return movie; // Return basic info if detailed request fails
          }
        })
      );

      response = {
        success: true,
        data: {
          movies: moviesWithDetails,
          totalResults: parseInt(data.totalResults),
          currentPage: page,
          totalPages: Math.ceil(parseInt(data.totalResults) / 10)
        }
      };

      // Save search history
      try {
        if (isMongoConnected) {
          await SearchHistory.create({
            query,
            results: parseInt(data.totalResults),
            userIP: req.ip
          });
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    } else {
      response = {
        success: false,
        error: data.Error || 'No movies found'
      };
    }

    // Cache the result
    cache.set(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/popular - Get popular movies (simulated with predefined searches)
app.get('/api/popular', async (req, res) => {
  try {
    const cacheKey = 'popular:movies';
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // Trending movie searches to simulate popular/trending movies
    const trendingSearches = ['Marvel', 'Batman', 'Spider-Man', 'Star Wars', 'Fast', 'Mission Impossible', 'John Wick', 'Transformers'];
    const popularMovies = [];

    for (const search of trendingSearches) {
      try {
        const apiUrl = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=${encodeURIComponent(search)}&page=1`;
        const data = await makeOMDBRequest(apiUrl);
        
        if (data.Response === 'True' && data.Search) {
          // Get the first 3 movies from each search to have more variety
          const movies = data.Search.slice(0, 3);
          for (const movie of movies) {
            const detailUrl = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${movie.imdbID}`;
            try {
              const detailData = await makeOMDBRequest(detailUrl);
              popularMovies.push({
                ...movie,
                Plot: detailData.Plot,
                Director: detailData.Director,
                Actors: detailData.Actors,
                Genre: detailData.Genre,
                Runtime: detailData.Runtime,
                imdbRating: detailData.imdbRating,
                Awards: detailData.Awards
              });
            } catch (error) {
              popularMovies.push(movie);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching trending movies for ${search}:`, error);
      }
    }

    // Remove duplicates and limit to 25 movies for better variety
    const uniqueMovies = popularMovies.filter((movie, index, self) => 
      index === self.findIndex(m => m.imdbID === movie.imdbID)
    ).slice(0, 25);

    const response = {
      success: true,
      data: {
        movies: uniqueMovies
      }
    };

    cache.set(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error('Trending movies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending movies'
    });
  }
});

// GET /api/movie/:id - Get detailed movie information
app.get('/api/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `movie:${id}`;
    
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const apiUrl = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${id}`;
    const data = await makeOMDBRequest(apiUrl);

    let response;
    if (data.Response === 'True') {
      response = {
        success: true,
        data: data
      };
    } else {
      response = {
        success: false,
        error: data.Error || 'Movie not found'
      };
    }

    cache.set(cacheKey, response);
    res.json(response);

  } catch (error) {
    console.error('Movie detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movie details'
    });
  }
});

// GET /api/movie/:imdbID - Get movie details by imdbID
app.get('/api/movie/:imdbID', async (req, res) => {
  try {
    const { imdbID } = req.params;
    if (!imdbID) {
      return res.status(400).json({ success: false, error: 'imdbID is required.' });
    }
    const apiUrl = `https://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${encodeURIComponent(imdbID)}`;
    const data = await makeOMDBRequest(apiUrl);
    if (data.Response === 'True') {
      res.json({ success: true, movie: data });
    } else {
      res.status(404).json({ success: false, error: data.Error || 'Movie not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch movie.' });
  }
});

// GET /api/search-history - Get search history
app.get('/api/search-history', async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.json({
        success: true,
        data: [],
        message: 'Search history not available - database not connected'
      });
    }

    try {
      const history = await SearchHistory.find()
        .sort({ timestamp: -1 })
        .limit(50)
        .select('query timestamp results');
      
      res.json({
        success: true,
        data: history
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      res.json({
        success: true,
        data: [],
        message: 'Search history temporarily unavailable'
      });
    }
  } catch (error) {
    console.error('Search history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch search history'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    database: isMongoConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});