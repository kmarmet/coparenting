import Manager from '@manager'
export default function TitleSuggestionWrapper({ suggestions = [], onClick, setSuggestions, className }) {
  return (
    <div className={`${className} title-suggestion-dropdown flex title-suggestion-dropdown-wrapper ${suggestions.length > 0 ? 'active ' : ''}`}>
      <div className="suggestions">
        {Manager.isValid(suggestions, true) &&
          suggestions.map((suggestion, index) => {
            return (
              <p key={index} onClick={onClick}>
                {suggestion.suggestion}
              </p>
            )
          })}
      </div>
      <span className="material-icons-round" onClick={setSuggestions}>
        cancel
      </span>
    </div>
  )
}
