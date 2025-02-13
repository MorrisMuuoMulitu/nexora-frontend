import React, { useState, useRef, useEffect } from 'react';
import './ShareButton.css';

const ShareButton = ({ articleUrl, articleTitle, onShareToggle }) => {
  const [showOptions, setShowOptions] = useState(false);
  const shareOptionsRef = useRef(null);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          url: articleUrl,
          title: articleTitle,
          text: "Check out this news article!",
        });
        console.log("Article shared successfully!");
      } catch (error) {
        console.error("Error sharing article:", error);
      }
    } else {
      alert("Web Share API is not supported in your browser. Use the links below to share.");
    }
    setShowOptions(true);
    if (onShareToggle) {
      onShareToggle(true); // Notify parent component that share options are visible
    }
  };

  const redditShareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(articleTitle)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(articleTitle)}`;

  // Close the share options if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(event.target)) {
        setShowOptions(false);
        if (typeof onShareToggle === 'function') {
          onShareToggle(false); // Notify parent component that share options are hidden
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [shareOptionsRef, onShareToggle]);

  return (
    <div className="share-buttons" ref={shareOptionsRef}>
      <button className="share-button" onClick={handleNativeShare} aria-label="Share this article">
        Share
      </button>
      {showOptions && (
        <div className="share-options">
          <a href={redditShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Reddit" className="share-option">
            Reddit
          </a>
          <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter" className="share-option">
            Twitter
          </a>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
