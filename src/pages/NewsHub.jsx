import React, { useState } from 'react';

export default function NewsHub({ articles = [] }) {
  const [activeArticle, setActiveArticle] = useState(null);

  return (
    <div className="newshub-page-wrapper section-container">
      <div className="section-header animate-slide-up">
        <span className="gold-badge">Luxury Editorial</span>
        <h2>Reach Content & News Hub</h2>
        <p className="section-subtitle">
          Curated perspectives on automotive engineering, private aviation logistics, executive lifestyle, and travel protocols.
        </p>
      </div>

      <div className="news-grid animate-fade-in">
        {articles.map((art) => (
          <article 
            key={art.id} 
            className="news-card glass-panel glass-panel-hover"
            onClick={() => setActiveArticle(art)}
          >
            <div className="news-image-wrapper">
              <img src={art.image} alt={art.title} />
              <span className="news-category-badge">{art.category}</span>
            </div>
            <div className="news-card-body">
              <div className="news-meta">
                <span>{art.date}</span>
                <span>•</span>
                <span>{art.readTime}</span>
              </div>
              <h3>{art.title}</h3>
              <p>{art.summary}</p>
              <span className="read-more-link gradient-text-gold">Read Article →</span>
            </div>
          </article>
        ))}
      </div>

      {/* Full Article Overlay Modal */}
      {activeArticle && (
        <div className="article-overlay" onClick={() => setActiveArticle(null)}>
          <div className="article-modal glass-panel animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="article-modal-header">
              <span className="gold-badge">{activeArticle.category}</span>
              <button className="article-close-btn" onClick={() => setActiveArticle(null)}>×</button>
            </div>
            
            <img src={activeArticle.image} alt={activeArticle.title} className="article-modal-hero" />
            
            <div className="article-modal-body">
              <div className="news-meta">
                <span>{activeArticle.date}</span>
                <span>•</span>
                <span>{activeArticle.readTime}</span>
              </div>
              <h2>{activeArticle.title}</h2>
              <div className="article-paragraphs">
                {activeArticle.content.split('\n\n').map((para, idx) => (
                  <p key={idx}>{para.trim()}</p>
                ))}
              </div>
            </div>

            <div className="article-modal-footer">
              <button className="btn-champagne" onClick={() => setActiveArticle(null)}>
                Close Editorial
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .news-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-top: 40px;
        }

        @media (max-width: 900px) {
          .news-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        .news-card {
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }

        .news-image-wrapper {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
        }

        .news-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .news-card:hover .news-image-wrapper img {
          transform: scale(1.05);
        }

        .news-category-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(8, 8, 10, 0.75);
          backdrop-filter: blur(5px);
          border: 1px solid var(--glass-border);
          color: var(--color-champagne);
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 6px 12px;
          border-radius: 30px;
          letter-spacing: 0.05em;
        }

        .news-card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-grow: 1;
        }

        .news-meta {
          font-size: 0.75rem;
          color: var(--color-silver);
          display: flex;
          gap: 8px;
        }

        .news-card-body h3 {
          font-size: 1.15rem;
          font-weight: 700;
          line-height: 1.4;
          color: var(--color-platinum);
        }

        .news-card-body p {
          font-size: 0.85rem;
          color: var(--color-silver);
          line-height: 1.5;
          flex-grow: 1;
        }

        .read-more-link {
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.85rem;
          margin-top: 10px;
        }

        /* Article Modal Overlay */
        .article-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(8, 8, 10, 0.9);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 24px;
        }

        .article-modal {
          width: 100%;
          max-width: 750px;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 24px;
          border-color: rgba(255, 255, 255, 0.15);
          display: flex;
          flex-direction: column;
        }

        .article-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 1px solid var(--glass-border);
        }

        .article-close-btn {
          background: none;
          border: none;
          color: var(--color-silver);
          font-size: 2rem;
          cursor: pointer;
          line-height: 1;
          transition: var(--transition-smooth);
        }

        .article-close-btn:hover {
          color: var(--color-champagne);
        }

        .article-modal-hero {
          width: 100%;
          height: 300px;
          object-fit: cover;
        }

        .article-modal-body {
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .article-modal-body h2 {
          font-size: 1.8rem;
          font-weight: 800;
          line-height: 1.25;
        }

        .article-paragraphs {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 10px;
        }

        .article-paragraphs p {
          color: var(--color-silver);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .article-modal-footer {
          padding: 20px 30px;
          border-top: 1px solid var(--glass-border);
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
}
