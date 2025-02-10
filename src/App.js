import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import "./App.css";
import moment from 'moment';
import Loader from './components/Loader'; // Import Loader component

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const loadingRef = useRef(null);
  const [savedArticles, setSavedArticles] = useState(() => {
    const saved = localStorage.getItem('savedArticles');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSavedArticles, setShowSavedArticles] = useState(false);

  const categories = [
    { value: '', label: 'All' },
    { value: 'business', label: 'Business' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'health', label: 'Health' },
    { value: 'science', label: 'Science' },
    { value: 'sports', label: 'Sports' },
    { value: 'technology', label: 'Technology' },
  ];


  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (category) params.append("category", category);
        if (query) params.append("q", query);
        params.append("page", page);
        params.append("pageSize", 10);

        const response = await axios.get(
          "https://nexora-backend.onrender.com/news",
          { params }
        );

        if (page === 1) {
          setArticles(response.data);
        } else {
          setArticles(prevArticles => [...prevArticles, ...response.data]);
        }
        setTimeout(() => {
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error fetching news:", error.message);
        setLoading(false);
      }
    };

    fetchNews();
  }, [category, page, query]);

  useEffect(() => {
    localStorage.setItem('savedArticles', JSON.stringify(savedArticles));
  }, [savedArticles]);


  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleScroll = useCallback(() => {
    if (loadingRef.current) {
      const rect = loadingRef.current.getBoundingClientRect();
      if (rect.top <= window.innerHeight && !loading) {
        setPage(prevPage => prevPage + 1);
      }
    }
  }, [loading]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const truncateDescription = (description, maxLength = 100) => {
    if (!description) return "No description available.";
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength) + "...";
  };

  const saveArticle = (article) => {
    if (!isArticleSaved(article)) {
      setSavedArticles(prevSavedArticles => [...prevSavedArticles, article]);
    }
  };

  const removeArticle = (article) => {
    setSavedArticles(prevSavedArticles => prevSavedArticles.filter(saved => saved.url !== article.url));
  };


  const isArticleSaved = (article) => {
    return savedArticles.some(saved => saved.url === article.url);
  };

  const toggleSavedArticlesView = () => {
    setShowSavedArticles(!showSavedArticles);
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setPage(1);
  };


  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <header className="app-header">
        <h1>Nexora News</h1>
        <button onClick={toggleDarkMode} className="dark-mode-toggle">
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </header>

      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        <button onClick={() => setShowSavedArticles(false)} disabled={!showSavedArticles}>
          Headlines
        </button>
        <button onClick={toggleSavedArticlesView} disabled={showSavedArticles}>
          Saved Articles
        </button>
      </div>


      {/* Search Bar */}
      {!showSavedArticles && (
        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search for news..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      )}

      {/* Category Chips */}
      {!showSavedArticles && (
        <div className="category-chips">
          {categories.map(cat => (
            <button
              key={cat.value}
              className={`category-chip ${category === cat.value ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Articles List */}
      {loading && page === 1 && !showSavedArticles ? (
        <Loader /> // Replaced "Loading..." text with Loader component
      ) : !showSavedArticles ? (
        <div className="article-list">
          {articles.map((article, index) => (
            <div key={index} className="article-card">
              <img
                src={article.urlToImage || "https://via.placeholder.com/150"}
                alt={article.title}
              />
              <div className="article-content">
                <h2>{article.title}</h2>
                <p className="article-description">
                  <span className="summary-text">{truncateDescription(article.description)}</span>
                  <span className="full-description">{article.description}</span>
                </p>
                <div className="article-footer">
                  <span className="article-source">{article.source.name}</span>
                  <span className="article-date">
                    {moment(article.publishedAt).format("MMM D, YYYY")}
                  </span>
                </div>
                <div className="article-actions">
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    Read More
                  </a>
                  <button
                    className="save-button"
                    onClick={() => saveArticle(article)}
                    disabled={isArticleSaved(article)}
                  >
                    {isArticleSaved(article) ? 'Saved' : 'Save Article'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {loading && <Loader ref={loadingRef} />} {/* Loader component for infinite scroll */}
          {!loading && <div ref={loadingRef}></div>}
        </div>
      ) : showSavedArticles ? (
        <div className="article-list">
          {savedArticles.map((article, index) => (
            <div key={index} className="article-card">
              <img
                src={article.urlToImage || "https://via.placeholder.com/150"}
                alt={article.title}
              />
              <div className="article-content">
                <h2>{article.title}</h2>
                <p className="article-description">
                  {truncateDescription(article.description)}
                </p>
                <div className="article-footer">
                  <span className="article-source">{article.source.name}</span>
                  <span className="article-date">
                    {moment(article.publishedAt).format("MMM D, YYYY")}
                  </span>
                </div>
                <div className="article-actions">
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    Read More
                  </a>
                  <button
                    className="remove-button"
                    onClick={() => removeArticle(article)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          {savedArticles.length === 0 && <p>No saved articles yet.</p>}
        </div>
      ) : null}


    </div>
  );
}

export default App;
