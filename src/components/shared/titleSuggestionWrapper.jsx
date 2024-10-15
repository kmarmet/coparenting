import Manager from '@manager'
import globalState from '../../context'
import { useContext } from 'react'
export default function TitleSuggestionWrapper({ suggestions = [], onClick, setSuggestions, className }) {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, setTheme } = state
  return (
    <div
      className={`${className} ${`${theme}`} title-suggestion-dropdown flex title-suggestion-dropdown-wrapper ${suggestions.length > 0 ? 'active ' : ''}`}>
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
