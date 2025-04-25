import React from 'react';
import './MatchCard.css';

const MatchCard = ({ match }) => {
  const getButtonContent = () => {
    switch(match.status) {
      case 'live':
        return { text: 'Regarder en Direct', icon: 'fas fa-play' };
      case 'finished':
        return { text: 'Voir Résumé', icon: 'fas fa-clipboard' };
      default:
        return { text: 'Programmer Rappel', icon: 'far fa-bell' };
    }
  };

  const buttonContent = getButtonContent();

  return (
    <div className={`match-card ${match.status}`}>
      <div className={`status-badge ${match.status}`}>
        {match.status === 'live' && <span className="live-dot"></span>}
        <span>{match.status === 'live' ? 'En Direct' : match.status === 'finished' ? 'Terminé' : 'À Venir'}</span>
      </div>
      
      <div className="match-time">
        <i className="far fa-clock"></i> {match.date}
        {match.minute && <span className="match-minute">{match.minute}</span>}
      </div>
      
      <div className="match-info">{match.info}</div>
      
      <div className="teams-container">
        <div className="team">
          <div className="team-logo">
            <img src={match.homeTeam.logo} alt={match.homeTeam.name} />
          </div>
          <div className="team-name">{match.homeTeam.name}</div>
          <div className="team-country">{match.homeTeam.country}</div>
        </div>
        
        <div className="score">{match.score}</div>
        
        <div className="team">
          <div className="team-logo">
            <img src={match.awayTeam.logo} alt={match.awayTeam.name} />
          </div>
          <div className="team-name">{match.awayTeam.name}</div>
          <div className="team-country">{match.awayTeam.country}</div>
        </div>
      </div>
      
      <button 
        className={`watch-btn ${match.status}`}
        onClick={() => match.status === 'live' && watchMatch(match.id)}
      >
        <i className={buttonContent.icon}></i> {buttonContent.text}
      </button>
    </div>
  );
};

const watchMatch = (matchId) => {
  alert(`Fonctionnalité de streaming simulée\nVous seriez redirigé vers le match #${matchId} en direct`);
};

export default MatchCard;