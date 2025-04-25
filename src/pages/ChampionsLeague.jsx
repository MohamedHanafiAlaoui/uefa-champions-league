import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './FootballMatchesApp.css';

const MATCHES_PER_PAGE = 4;
const API_BASE_URL = 'https://api.sofascore.com/api/v1';
const MATCH_DATES = ['2025-04-15', '2025-04-16'];

const MATCH_STATUS = {
  notstarted: { label: 'UPCOMING', color: '#4CAF50' },
  inprogress: { label: 'LIVE NOW', color: '#FF5722' },
  finished: { label: 'COMPLETED', color: '#607D8B' },
  postponed: { label: 'POSTPONED', color: '#9E9E9E' },
  default: { label: 'UNKNOWN', color: '#9E9E9E' }
};

function FootballMatchesApp() {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Update window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusInfo = (statusType) => {
    return MATCH_STATUS[statusType] || MATCH_STATUS.default;
  };

  const fetchMatchDetails = useCallback(async (match) => {
    if (match.status?.type === 'finished') {
      try {
        const response = await axios.get(`${API_BASE_URL}/event/${match.id}`);
        return {
          ...match,
          manOfTheMatch: response.data.event?.bestPlayer,
          highlights: response.data.event?.videos?.find(v => v.type === 'highlights')
        };
      } catch (error) {
        console.error(`Error fetching details for match ${match.id}:`, error);
      }
    }
    return match;
  }, []);

  const filterMatchesByDates = useCallback((allMatches) => {
    return allMatches.filter((match) => {
      const dateUTC = new Date(match.startTimestamp * 1000).toISOString().split('T')[0];
      return MATCH_DATES.includes(dateUTC);
    });
  }, []);

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const datePromises = MATCH_DATES.map(date => 
          axios.get(`${API_BASE_URL}/sport/football/scheduled-events/${date}`)
        );
        
        const responses = await Promise.all(datePromises);
        const allMatches = responses.flatMap(response => response.data.events || []);
        const filteredMatches = filterMatchesByDates(allMatches);
        const enhancedMatches = await Promise.all(
          filteredMatches.map(fetchMatchDetails)
        );
        
        setMatches(enhancedMatches);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setError('Failed to load matches. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMatches();
  }, [fetchMatchDetails, filterMatchesByDates]);

  // Get unique leagues for filter
  const leagues = [...new Set(matches.map(match => match.tournament?.name))].filter(Boolean);

  // Filter matches by selected league
  const filteredMatches = selectedLeague === 'all' 
    ? matches 
    : matches.filter(match => match.tournament?.name === selectedLeague);

  // Pagination logic
  const totalPages = Math.ceil(filteredMatches.length / MATCHES_PER_PAGE);
  const indexOfLastMatch = currentPage * MATCHES_PER_PAGE;
  const indexOfFirstMatch = indexOfLastMatch - MATCHES_PER_PAGE;
  const currentMatches = filteredMatches.slice(indexOfFirstMatch, indexOfLastMatch);

  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const Pagination = () => {
    const getPageNumbers = () => {
      const pageNumbers = [];
      const maxVisiblePages = windowWidth < 768 ? 5 : 7;
      
      // Always show first page
      pageNumbers.push(1);
      
      // Calculate range around current page
      let startPage = Math.max(2, currentPage - 2);
      let endPage = Math.min(totalPages - 1, currentPage + 2);
      
      // Adjust if we're at the start or end
      if (currentPage <= 3) {
        endPage = Math.min(5, totalPages - 1);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(totalPages - 4, 2);
      }
      
      // Add ellipsis if needed after first page
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis if needed before last page
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always show last page if there's more than 1 page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
      
      return pageNumbers.slice(0, maxVisiblePages);
    };

    return (
      <div className="pagination">
        <button 
          onClick={() => paginate(currentPage - 1)} 
          disabled={currentPage === 1}
          className={`pagination-button prev ${currentPage === 1 ? 'disabled' : ''}`}
          aria-label="Previous page"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        
        <div className="page-numbers">
          {getPageNumbers().map((number, index) => (
            number === '...' ? (
              <span key={`ellipsis-${index}`} className="ellipsis">...</span>
            ) : (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`page-number ${currentPage === number ? 'active' : ''}`}
                aria-label={`Page ${number}`}
                aria-current={currentPage === number ? 'page' : null}
              >
                {number}
              </button>
            )
          ))}
        </div>
        
        <button 
          onClick={() => paginate(currentPage + 1)} 
          disabled={currentPage === totalPages}
          className={`pagination-button next ${currentPage === totalPages ? 'disabled' : ''}`}
          aria-label="Next page"
        >
          Next
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };

  const MatchCard = ({ match }) => {
    const statusInfo = getStatusInfo(match.status?.type);
    const isLive = match.status?.type === 'inprogress';
    const isCompleted = match.status?.type === 'finished';
    
    return (
      <div className={`match-card ${isLive ? 'live' : ''}`}>
        <div className="card-header">
          <div className="league-info">
            <span className="league-name">{match.tournament?.name || 'Unknown League'}</span>
            <span className="match-status" style={{ backgroundColor: statusInfo.color }}>
              {statusInfo.label}
            </span>
          </div>
          {isLive && (
            <div className="live-indicator">
              <span className="pulse"></span>
              LIVE
            </div>
          )}
        </div>
        
        <div className="teams-container">
          <div className="team home-team">
            {match.homeTeam?.pictureUrl && (
              <img src={match.homeTeam.pictureUrl} alt={match.homeTeam.name} className="team-logo" />
            )}
            <span className="team-name">{match.homeTeam?.name || 'Home'}</span>
          </div>
          
          <div className="match-center">
            {isLive || isCompleted ? (
              <div className="score-container">
                <span className="score">{match.homeScore?.current ?? '-'}</span>
                <span className="score-divider">:</span>
                <span className="score">{match.awayScore?.current ?? '-'}</span>
              </div>
            ) : (
              <div className="time-container">
                <span className="match-time">{formatTime(match.startTimestamp)}</span>
                <span className="match-date">{formatDate(match.startTimestamp)}</span>
              </div>
            )}
          </div>
          
          <div className="team away-team">
            {match.awayTeam?.pictureUrl && (
              <img src={match.awayTeam.pictureUrl} alt={match.awayTeam.name} className="team-logo" />
            )}
            <span className="team-name">{match.awayTeam?.name || 'Away'}</span>
          </div>
        </div>
        
        <div className="match-footer">
          <div className="match-venue">
            <span className="venue-icon">🏟️</span>
            <span>{match.venue?.name || 'Venue not specified'}</span>
          </div>
          
          {isCompleted && match.manOfTheMatch && (
            <div className="motm">
              <span className="motm-label">Player of the Match:</span>
              <span className="motm-name">{match.manOfTheMatch.name}</span>
            </div>
          )}
          
          {match.highlights && (
            <button className="highlights-button">
              <span className="play-icon">▶</span>
              Watch Highlights
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="football-app">
      <header className="app-header">
        <h1 className="app-title">Football Fixtures</h1>
        <p className="app-subtitle">Stay updated with the latest matches</p>
      </header>
      
      <main className="app-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading matches...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Error Loading Data</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="controls">
              <div className="league-filter">
                <label htmlFor="league-select">Filter by League:</label>
                <select 
                  id="league-select"
                  value={selectedLeague}
                  onChange={(e) => {
                    setSelectedLeague(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Leagues</option>
                  {leagues.map(league => (
                    <option key={league} value={league}>{league}</option>
                  ))}
                </select>
              </div>
              
              <div className="pagination-info">
                Showing {indexOfFirstMatch + 1}-{Math.min(indexOfLastMatch, filteredMatches.length)} of {filteredMatches.length} matches
              </div>
            </div>
            
            {currentMatches.length > 0 ? (
              <div className="matches-grid">
                {currentMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⚽</div>
                <h3>No Matches Found</h3>
                <p>There are no matches available for the selected criteria.</p>
              </div>
            )}
            
            {filteredMatches.length > MATCHES_PER_PAGE && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                paginate={paginate}
              />
            )}
          </>
        )}
      </main>
      
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Football Fixtures App</p>
        <p>Data provided by SofaScore API</p>
      </footer>
    </div>
  );
}

export default FootballMatchesApp;