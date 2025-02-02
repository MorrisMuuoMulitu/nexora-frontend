import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const params = new URLSearchParams();
        if (category) params.append("category", category);
        if (query) params.append("q", query);
        params.append("page", page);
        params.append("pageSize", 10);

        const response = await axios.get(
          `http://localhost:5003/news?${params.toString()}`,
        );
        setArticles(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching news:", error.message);
        setLoading(false);
      }
    };

    fetchNews();
  }, [query, category, page]);

  return (
    <div className="App">
      <h1>Nexora News</h1>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for news..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={() => setPage(1)}>Search</button>
      </div>

      {/* Category Dropdown */}
      <div className="category-dropdown">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Categories</option>
          <option value="business">Business</option>
          <option value="entertainment">Entertainment</option>
          <option value="health">Health</option>
          <option value="science">Science</option>
          <option value="sports">Sports</option>
          <option value="technology">Technology</option>
        </select>
      </div>

      {/* Articles List */}
      {loading ? (
        <div className="loader">Loading...</div>
      ) : articles.length > 0 ? (
        <div className="article-list">
          {articles.map((article, index) => (
            <div key={index} className="article-card">
              <img
                src={article.urlToImage || "https://via.placeholder.com/150"}
                alt={article.title}
              />
              <h2>{article.title}</h2>
              <p>{article.description || "No description available."}</p>
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                Read More
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p>No news articles found.</p>
      )}

      {/* Pagination Controls */}
      <div className="pagination">
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export default App;
