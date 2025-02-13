import React, {
  useEffect,
  useState,
  useRef,
  Suspense,
} from "react";
import axios from "axios";
import "./App.css";
import moment from "moment";
import Loader from "./components/Loader";
import { useInView } from "react-intersection-observer"; // For infinite scroll
import {
  CSSTransition,
  TransitionGroup,
} from "react-transition-group"; // For animations

// Lazy load the share button component
const ShareButton = React.lazy(() => import("./components/ShareButton"));

//Truncate description for saved articles
const truncateDescription = (description, maxLength = 100) => {
  if (!description) return "No description available.";
  if (description.length <= maxLength) return description;
  return description.slice(0, maxLength) + "...";
};

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState(null); // For error handling
  const [savedArticles, setSavedArticles] = useState(() => {
    const saved = localStorage.getItem("savedArticles");
    return saved ? JSON.parse(saved) : [];
  });
  const [showSavedArticles, setShowSavedArticles] = useState(false);

  const categories = [
    { value: "", label: "All" },
    { value: "business", label: "Business" },
    { value: "entertainment", label: "Entertainment" },
    { value: "health", label: "Health" },
    { value: "science", label: "Science" },
    { value: "sports", label: "Sports" },
    { value: "technology", label: "Technology" },
  ];

  const articleListRef = useRef(null);

  // Intersection observer for infinite scroll
  const { ref: infiniteScrollRef, inView } = useInView({
    threshold: 0.2,
  });

  // Function to cache articles
  const cacheArticles = (articlesToCache) => {
    try {
      localStorage.setItem("cachedArticles", JSON.stringify(articlesToCache));
    } catch (e) {
      console.error("Failed to cache articles:", e);
    }
  };

  // Function to retrieve cached articles
  const getCachedArticles = () => {
    try {
      const cached = localStorage.getItem("cachedArticles");
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      console.error("Failed to retrieve cached articles:", e);
      return [];
    }
  };

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        const params = new URLSearchParams();
        if (category) params.append("category", category);
        if (query) params.append("q", query);
        params.append("page", 1); // Always start from page 1 when category/query changes
        params.append("pageSize", 10);

        const response = await axios.get(
          "https://nexora-backend.onrender.com/news",
          { params }
        );

        const processArticles = (articles) => {
          return articles.map((article) => {
            if (article.description) {
              const sentences = article.description.split(".");
              const firstSentence =
                sentences.length > 0 ? sentences[0] + "." : "";
              return {
                ...article,
                truncatedDescription: firstSentence,
                description: undefined,
                showShare: false, // Initialize showShare to false
              };
            } else {
              return {
                ...article,
                truncatedDescription: "No description available.",
                description: undefined,
                showShare: false, // Initialize showShare to false
              };
            }
          });
        };

        const uniqueArticles = response.data.filter(
          (article, index, self) =>
            index === self.findIndex(
              (a) =>
                (a.url && a.url === article.url) ||
                (a.title === article.title &&
                  a.publishedAt === article.publishedAt)
            )
        );

        const processedUniqueArticles = processArticles(uniqueArticles);

        setArticles(processedUniqueArticles);
        cacheArticles(processedUniqueArticles); // Cache the articles
        setPage(1); // Reset page to 1 after loading new articles
        setError(null); // Clear any previous error messages
      } catch (apiError) {
        console.error("Error fetching news:", apiError.message);
        setError("Failed to load news. Displaying cached news.");
        // Attempt to load cached articles on error
        const cached = getCachedArticles();
        if (cached.length > 0) {
          setArticles(cached);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [category, query]); // Removed page from dependency array

  useEffect(() => {
    localStorage.setItem("savedArticles", JSON.stringify(savedArticles));
  }, [savedArticles]);

  // Load more articles when inView changes to true
  useEffect(() => {
    if (inView && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [inView, loading]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const saveArticle = (article) => {
    if (!isArticleSaved(article)) {
      setSavedArticles((prevSavedArticles) => [...prevSavedArticles, article]);
    }
  };

  const removeArticle = (article) => {
    setSavedArticles((prevSavedArticles) =>
      prevSavedArticles.filter((saved) => saved.url !== article.url)
    );
  };

  const isArticleSaved = (article) => {
    return savedArticles.some((saved) => saved.url === article.url);
  };

  const toggleSavedArticlesView = () => {
    setShowSavedArticles(!showSavedArticles);
  };

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory);
    setPage(1);
  };

  return (
    <div className={`App ${darkMode ? "dark-mode" : ""}`}>
      <header className="app-header">
        <h1>Nexora News</h1>
        <button onClick={toggleDarkMode} className="dark-mode-toggle">
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </header>

      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        <button
          onClick={() => setShowSavedArticles(false)}
          disabled={!showSavedArticles}
        >
          Headlines
        </button>
        <button
          onClick={toggleSavedArticlesView}
          disabled={showSavedArticles}
        >
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
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`category-chip ${
                category === cat.value ? "active" : ""
              }`}
              onClick={() => handleCategoryChange(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Articles List */}
      {loading && page === 1 && !showSavedArticles ? (
        <Loader /> // Replaced "Loading..." text with Loader component
      ) : !showSavedArticles ? (
        <TransitionGroup
          className="article-list"
          component="div"
          ref={articleListRef}
        >
          {articles.map((article, index) => (
            <CSSTransition
              key={article.url || index}
              timeout={500}
              classNames="fade"
            >
              <div className="article-card">
                <img
                  src={article.urlToImage || "https://via.placeholder.com/150"}
                  alt={article.title}
                  loading="lazy" // Lazy loading for images
                />
                <div className="article-content">
                  <h2>{article.title}</h2>
                  <p className="article-description">
                    <span className="summary-text">
                      {article.truncatedDescription}
                    </span>
                  </p>
                  <div className="article-footer">
                    <span className="article-source">{article.source.name}</span>
                    <span className="article-date">
                      {moment(article.publishedAt).format("MMM D, YYYY")}
                    </span>
                  </div>
                  <div className={`article-actions ${article.showShare ? 'hidden' : ''}`}>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read More
                    </a>
                    <button
                      className="save-button"
                      onClick={() => saveArticle(article)}
                      disabled={isArticleSaved(article)}
                    >
                      {isArticleSaved(article) ? "Saved" : "Save Article"}
                    </button>
                    <Suspense fallback={<div>Loading share...</div>}>
                      <ShareButton
                        articleUrl={article.url}
                        articleTitle={article.title}
                        onShareToggle={(isVisible) => {
                          const newArticles = [...articles];
                          newArticles[index].showShare = isVisible;
                          setArticles([...newArticles]);
                        }}
                      />
                    </Suspense>
                  </div>
                </div>
              </div>
            </CSSTransition>
          ))}
          {loading && <Loader />}
          <div ref={infiniteScrollRef} />
          {/* Intersection observer */}
        </TransitionGroup>
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
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
