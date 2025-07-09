import React, { useState, useEffect, useRef } from 'react';
import { Search, Film, Star, Calendar, Clock, Users, Award, X, ChevronLeft, ChevronRight, User, Bell, Camera, LogIn, UserPlus } from 'lucide-react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
  Plot?: string;
  Director?: string;
  Actors?: string;
  Genre?: string;
  Runtime?: string;
  imdbRating?: string;
  Awards?: string;
}

interface SearchResponse {
  success: boolean;
  data?: {
    movies: Movie[];
    totalResults: number;
    currentPage: number;
    totalPages: number;
  };
  error?: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
  error?: string;
  username?: string; // Added for login success
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
  </div>
);

// Update MovieCard for accent color and correct favorite logic
const MovieCard = ({ movie, onClick, favorites, authToken, addFavorite, removeFavorite }: {
  movie: Movie;
  onClick: () => void;
  favorites: string[];
  authToken: string | null;
  addFavorite: (imdbID: string) => void;
  removeFavorite: (imdbID: string) => void;
}) => {
  const isFavorite = favorites.includes(movie.imdbID);
  return (
    <div
      className="glass-card cursor-pointer group relative p-3 flex flex-col h-full hover:shadow-glass transition"
      onClick={onClick}
      style={{ minHeight: 420 }}
    >
      {/* Favorite button */}
      {authToken && (
        <button
          className={`absolute top-3 left-3 z-10 rounded-full p-1 border-2 ${isFavorite ? 'border-accent bg-accent text-gray-900' : 'border-glass-light bg-glass-dark text-accent'} shadow-glass hover:scale-110 transition`}
          onClick={e => {
            e.stopPropagation();
            isFavorite ? removeFavorite(movie.imdbID) : addFavorite(movie.imdbID);
          }}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? <Star size={22} fill="#ffd700" /> : <Star size={22} />}
        </button>
      )}
      <div className="relative overflow-hidden rounded-lg mb-3 flex-1 flex items-center justify-center bg-gray-900/40">
        <img
          src={movie.Poster !== 'N/A' ? movie.Poster : '/api/placeholder/300/400'}
          alt={movie.Title}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg shadow-lg"
          onError={(e) => {
            e.currentTarget.src = `https://via.placeholder.com/300x400/1e293b/ffffff?text=${encodeURIComponent(movie.Title)}`;
          }}
        />
        <div className="absolute top-2 right-2 bg-accent text-gray-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-glass">
          <Star size={12} />
          {movie.imdbRating || 'N/A'}
        </div>
      </div>
      <h3 className="font-semibold text-lg mb-1 line-clamp-2 text-accent group-hover:text-accent/80 transition">{movie.Title}</h3>
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
        <Calendar size={14} />
        <span>{movie.Year}</span>
      </div>
      {movie.Genre && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{movie.Genre}</p>
      )}
    </div>
  );
};

// Update MovieModal for glassmorphism and neon
const MovieModal = ({ movie, onClose }: { movie: Movie; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
    <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-neon border-2 border-neon-yellow">
      <div className="p-8">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-3xl font-bold text-neon-yellow tracking-tight">{movie.Title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neon-yellow/20 rounded-full transition-colors"
          >
            <X size={28} className="text-neon-yellow" />
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1 flex items-center justify-center">
            <img
              src={movie.Poster !== 'N/A' ? movie.Poster : '/api/placeholder/300/400'}
              alt={movie.Title}
              className="w-full rounded-lg shadow-neon"
              onError={(e) => {
                e.currentTarget.src = `https://via.placeholder.com/300x400/1e293b/ffffff?text=${encodeURIComponent(movie.Title)}`;
              }}
            />
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-neon-yellow">
                <Calendar size={16} />
                <span>{movie.Year}</span>
              </div>
              {movie.Runtime && (
                <div className="flex items-center gap-1 text-neon-cyan">
                  <Clock size={16} />
                  <span>{movie.Runtime}</span>
                </div>
              )}
              {movie.imdbRating && (
                <div className="flex items-center gap-1 text-neon-pink">
                  <Star size={16} />
                  <span>{movie.imdbRating}/10</span>
                </div>
              )}
            </div>
            {movie.Genre && (
              <div>
                <h4 className="font-semibold mb-1 text-neon-cyan">Genre</h4>
                <p className="text-gray-300">{movie.Genre}</p>
              </div>
            )}
            {movie.Plot && (
              <div>
                <h4 className="font-semibold mb-1 text-neon-yellow">Plot</h4>
                <p className="text-gray-300">{movie.Plot}</p>
              </div>
            )}
            {movie.Director && (
              <div>
                <h4 className="font-semibold mb-1 text-neon-green">Director</h4>
                <p className="text-gray-300">{movie.Director}</p>
              </div>
            )}
            {movie.Actors && (
              <div>
                <h4 className="font-semibold mb-1 flex items-center gap-1 text-neon-cyan">
                  <Users size={16} />
                  Cast
                </h4>
                <p className="text-gray-300">{movie.Actors}</p>
              </div>
            )}
            {movie.Awards && movie.Awards !== 'N/A' && (
              <div>
                <h4 className="font-semibold mb-1 flex items-center gap-1 text-neon-pink">
                  <Award size={16} />
                  Awards
                </h4>
                <p className="text-gray-300">{movie.Awards}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void; 
}) => (
  <div className="flex justify-center items-center space-x-2 mt-8">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ChevronLeft size={20} />
    </button>
    
    <span className="px-4 py-2 glass-card">
      Page {currentPage} of {totalPages}
    </span>
    
    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <ChevronRight size={20} />
    </button>
  </div>
);

// Update FavoritesPage to only show favorite movies
const FavoritesPage = ({
  favoriteMovies,
  favorites,
  authToken,
  addFavorite,
  removeFavorite,
  loadingFavorites,
  setSelectedMovie
}: {
  favoriteMovies: Movie[];
  favorites: string[];
  authToken: string | null;
  addFavorite: (imdbID: string) => void;
  removeFavorite: (imdbID: string) => void;
  loadingFavorites: boolean;
  setSelectedMovie: (movie: Movie) => void;
}) => {
  // No debug panel, just show the movie cards
  return (
    <div className="max-w-5xl mx-auto px-4 mt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-100 flex items-center gap-2">
          <Star size={28} className="text-accent" /> Favorites
        </h2>
      </div>
      {loadingFavorites ? (
        <LoadingSpinner />
      ) : favoriteMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Star size={48} className="mb-4 text-gray-700" />
          <div className="text-lg">No favorite movies yet.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favoriteMovies.map(movie => (
            <MovieCard
              key={movie.imdbID}
              movie={movie}
              onClick={() => setSelectedMovie(movie)}
              favorites={favorites}
              authToken={authToken}
              addFavorite={addFavorite}
              removeFavorite={removeFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Redesigned ProfilePage component
const ProfilePage = ({ username }: { username: string | null }) => {
  return (
    <div className="max-w-xl mx-auto px-4 mt-16 flex flex-col items-center">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 to-gray-700 flex items-center justify-center mb-6 shadow-lg">
        <User size={64} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-100 mb-2">{username || 'User'}</h2>
      <div className="text-gray-400 mb-6">Welcome to your profile page.</div>
      <div className="w-full bg-gray-800 rounded-lg p-6 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Username</span>
          <span className="text-gray-200 font-mono">{username}</span>
        </div>
        {/* Add more user info here in the future */}
      </div>
    </div>
  );
};

// UserMenu component
const UserMenu = ({ username, onLogout }: { username: string | null, onLogout: () => void }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="relative inline-block text-left">
      <button className="btn-secondary flex items-center gap-1" onClick={() => setOpen(v => !v)}>
        <User size={20} />
        {username && <span>{username}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-gray-800 rounded shadow-lg z-50">
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-700" onClick={() => { setOpen(false); navigate('/profile'); }}>Profile</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-700" onClick={() => { setOpen(false); navigate('/favorites'); }}>Favorites</button>
          <button className="block w-full text-left px-4 py-2 hover:bg-gray-700" onClick={() => { setOpen(false); onLogout(); }}>Logout</button>
        </div>
      )}
    </div>
  );
};

// Move CombinedHeader to top-level, outside App
const CombinedHeader = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  isSearchMode,
  handleBackToPopular,
  searchInputRef,
  authToken,
  username,
  setShowLogin,
  setShowRegister,
  handleLogout,
  UserMenu
}: any) => (
  <div className="flex items-center justify-between w-full px-6 py-3 bg-transparent" style={{marginTop: '24px'}}>
    {/* Logo */}
    <Link to="/" className="text-2xl font-bold text-purple-400 tracking-widest select-none" style={{letterSpacing: '0.15em'}}>MOVIE</Link>
    {/* Search Bar */}
    <form onSubmit={handleSearch} className="flex-1 mx-8 flex items-center max-w-2xl">
      <div className="relative w-full">
        <input
          ref={searchInputRef}
          type="text"
          className="w-full pl-10 pr-12 py-2 rounded-full bg-white text-gray-900 placeholder-gray-400 shadow focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Movie, Genre, cast, story............"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400">
          <Search size={18} />
        </span>
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-400 text-white rounded-full p-2 hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
          tabIndex={0}
          aria-label="Search"
        >
          <Search size={18} />
        </button>
      </div>
      {isSearchMode && (
        <button
          type="button"
          className="ml-4 flex items-center justify-center bg-gray-800 hover:bg-purple-400 text-purple-400 hover:text-white rounded-full p-2 shadow focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
          onClick={handleBackToPopular}
          title="Back to Popular"
          aria-label="Back to Popular"
        >
          <ChevronLeft size={22} />
        </button>
      )}
    </form>
    {/* Icons and User Menu */}
    <div className="flex items-center gap-4">
      {authToken && username ? (
        <UserMenu username={username} onLogout={handleLogout} />
      ) : (
        <>
          <button
            className="bg-purple-400 hover:bg-purple-500 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            onClick={() => setShowLogin(true)}
            title="Login"
            aria-label="Login"
          >
            <LogIn size={22} />
          </button>
          <button
            className="bg-gray-800 hover:bg-purple-400 text-purple-400 hover:text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            onClick={() => setShowRegister(true)}
            title="Register"
            aria-label="Register"
          >
            <UserPlus size={22} />
          </button>
        </>
      )}
    </div>
  </div>
);

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch favorites function
  const fetchFavorites = async (token: string) => {
    try {
      const res = await axios.get('/api/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && Array.isArray(res.data.favorites)) {
        setFavorites(res.data.favorites);
        console.log('Fetched favorites:', res.data.favorites);
      } else {
        setFavorites([]);
        console.log('No favorites found');
      }
    } catch {
      setFavorites([]);
      console.log('Error fetching favorites');
    }
  };

  // Add to favorites function
  const addFavorite = async (imdbID: string) => {
    if (!authToken) return;
    try {
      const res = await axios.post('/api/favorites', { imdbID }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.data.success && Array.isArray(res.data.favorites)) {
        setFavorites(res.data.favorites);
      }
    } catch {}
  };

  // Remove from favorites function
  const removeFavorite = async (imdbID: string) => {
    if (!authToken) return;
    try {
      const res = await axios.delete('/api/favorites', {
        headers: { Authorization: `Bearer ${authToken}` },
        data: { imdbID }
      });
      if (res.data.success && Array.isArray(res.data.favorites)) {
        setFavorites(res.data.favorites);
      }
    } catch {}
  };

  // Fetch favorites on login
  useEffect(() => {
    if (authToken) {
      fetchFavorites(authToken);
    } else {
      setFavorites([]);
    }
  }, [authToken]);

  // Fetch details for all favorite movies using the new backend endpoint
  const fetchFavoriteMovies = async (ids: string[]) => {
    setLoadingFavorites(true);
    try {
      if (!ids.length) {
        setFavoriteMovies([]);
        setLoadingFavorites(false);
        return;
      }
      const res = await axios.post('/api/movies', { imdbIDs: ids });
      if (res.data.success && Array.isArray(res.data.movies)) {
        setFavoriteMovies(res.data.movies);
        console.log('Fetched favoriteMovies:', res.data.movies);
      } else {
        setFavoriteMovies([]);
        console.log('No favorite movies found');
      }
    } catch (error) {
      setFavoriteMovies([]);
      console.log('Error fetching favorite movies', error);
    } finally {
      setLoadingFavorites(false);
    }
  };

  // Fetch favorite movie details when favorites change
  useEffect(() => {
    if (favorites.length > 0) {
      fetchFavoriteMovies(favorites);
    } else {
      setFavoriteMovies([]);
    }
  }, [favorites]);

  useEffect(() => {
    fetchPopularMovies();
  }, []);

  const fetchPopularMovies = async () => {
    setLoading(true);
    try {
      const response = await axios.get<SearchResponse>('/api/popular');
      if (response.data.success && response.data.data) {
        setPopularMovies(response.data.data.movies);
      }
    } catch (err) {
      setError('Failed to fetch popular movies');
    } finally {
      setLoading(false);
    }
  };

  const searchMovies = async (query: string, page: number = 1) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get<SearchResponse>('/api/search', {
        params: { query, page }
      });
      
      if (response.data.success && response.data.data) {
        setMovies(response.data.data.movies);
        setCurrentPage(response.data.data.currentPage);
        setTotalPages(response.data.data.totalPages);
        setIsSearchMode(true);
      } else {
        setError(response.data.error || 'No movies found');
        setMovies([]);
      }
    } catch (err) {
      setError('Failed to search movies');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setError('Please enter a search term.');
      setIsSearchMode(false);
      setMovies([]);
      setCurrentPage(1);
      setTotalPages(1);
      return;
    }
    setCurrentPage(1);
    searchMovies(searchQuery, 1);
  };

  const handlePageChange = (page: number) => {
    searchMovies(searchQuery, page);
  };

  const handleBackToPopular = () => {
    setIsSearchMode(false);
    setSearchQuery('');
    setMovies([]);
    setError('');
  };

  // Auth handlers
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await axios.post<AuthResponse>(
        '/api/register',
        { username: registerUsername, password: registerPassword, email: registerEmail }
      );
      setShowRegister(false);
      setShowLogin(true);
      setRegisterUsername('');
      setRegisterPassword('');
      setRegisterEmail('');
      setAuthError('Registration successful! Please log in.');
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await axios.post<AuthResponse>(
        '/api/login',
        { identifier: loginIdentifier, password: loginPassword }
      );
      if (res.data.success && res.data.token) {
        setAuthToken(res.data.token);
        setUsername(res.data.username || '');
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username || '');
        setShowLogin(false);
        setLoginIdentifier('');
        setLoginPassword('');
        setAuthError('');
        fetchFavorites(res.data.token);
      } else {
        setAuthError(res.data.error || 'Login failed.');
      }
    } catch (err: any) {
      setAuthError(err.response?.data?.error || 'Login failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUsername(null);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };

  const displayMovies = isSearchMode ? movies : popularMovies;

  return (
    <Router>
      <CombinedHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        isSearchMode={isSearchMode}
        handleBackToPopular={handleBackToPopular}
        searchInputRef={searchInputRef}
        authToken={authToken}
        username={username}
        setShowLogin={setShowLogin}
        setShowRegister={setShowRegister}
        handleLogout={handleLogout}
        UserMenu={UserMenu}
      />
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen">
            {/* Main Content */}
            <main className="container mx-auto px-6 pb-8">
              {/* Title */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-center">
                  {isSearchMode ? `Search Results for "${searchQuery}"` : 'Popular Movies'}
                </h2>
              </div>
              {/* Error Message */}
              {error && (
                <div className="glass-card p-4 mb-6 border-red-500/50 bg-red-500/10">
                  <p className="text-red-400 text-center">{error}</p>
                </div>
              )}
              {/* Loading */}
              {loading && <LoadingSpinner />}
              {/* Movies Grid */}
              {!loading && displayMovies.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {displayMovies.map((movie) => (
                    <MovieCard
                      key={movie.imdbID}
                      movie={movie}
                      onClick={() => setSelectedMovie(movie)}
                      favorites={favorites}
                      authToken={authToken}
                      addFavorite={addFavorite}
                      removeFavorite={removeFavorite}
                    />
                  ))}
                </div>
              )}
              {/* Pagination */}
              {isSearchMode && totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
              {/* No Results */}
              {!loading && displayMovies.length === 0 && !error && (
                <div className="text-center py-12">
                  <Film size={64} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400 text-lg">
                    {isSearchMode ? 'No movies found for your search.' : 'No popular movies available.'}
                  </p>
                </div>
              )}
              {/* Movie Modal */}
              {selectedMovie && (
                <MovieModal
                  movie={selectedMovie}
                  onClose={() => setSelectedMovie(null)}
                />
              )}
            </main>
          </div>
        } />
        <Route path="/favorites" element={
          <FavoritesPage
            favoriteMovies={favoriteMovies}
            favorites={favorites}
            authToken={authToken}
            addFavorite={addFavorite}
            removeFavorite={removeFavorite}
            loadingFavorites={loadingFavorites}
            setSelectedMovie={setSelectedMovie}
          />
        } />
        <Route path="/profile" element={<ProfilePage username={username} />} />
      </Routes>
      {showRegister && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <form onSubmit={handleRegister} className="glass-card p-8 w-full max-w-sm space-y-4">
            <h2 className="text-xl font-bold mb-2">Register</h2>
            <input
              className="input w-full"
              type="email"
              placeholder="Email"
              value={registerEmail}
              onChange={e => setRegisterEmail(e.target.value)}
              required
            />
            <input
              className="input w-full"
              type="text"
              placeholder="Username"
              value={registerUsername}
              onChange={e => setRegisterUsername(e.target.value)}
              required
            />
            <input
              className="input w-full"
              type="password"
              placeholder="Password"
              value={registerPassword}
              onChange={e => setRegisterPassword(e.target.value)}
              required
            />
            {authError && <div className="text-red-400 text-sm">{authError}</div>}
            <div className="flex gap-2">
              <button className="btn-primary w-full" type="submit" disabled={authLoading}>{authLoading ? 'Registering...' : 'Register'}</button>
              <button className="btn-secondary w-full" type="button" onClick={() => setShowRegister(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <form onSubmit={handleLogin} className="glass-card p-8 w-full max-w-sm space-y-4">
            <h2 className="text-xl font-bold mb-2">Login</h2>
            <input
              className="input w-full"
              type="text"
              placeholder="Username or Email"
              value={loginIdentifier}
              onChange={e => setLoginIdentifier(e.target.value)}
              required
            />
            <input
              className="input w-full"
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              required
            />
            {authError && <div className="text-red-400 text-sm">{authError}</div>}
            <div className="flex gap-2">
              <button className="btn-primary w-full" type="submit" disabled={authLoading}>{authLoading ? 'Logging in...' : 'Login'}</button>
              <button className="btn-secondary w-full" type="button" onClick={() => setShowLogin(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {/* Show MovieModal for favorites page too */}
      {selectedMovie && (
        <MovieModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </Router>
  );
}

export default App;