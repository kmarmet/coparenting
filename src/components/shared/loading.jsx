import React, {useEffect} from 'react'
import DomManager from '../../managers/domManager'

export default function Loading({theme = 'light', isLoading}) {
  const ToggleAnimation = () => {
    if (isLoading === true) DomManager.ToggleAnimation('add', 'loading-overlay', DomManager.AnimateClasses.names.fadeIn)
    else {
      setTimeout(() => {
        DomManager.ToggleAnimation('remove', 'loading-overlay', DomManager.AnimateClasses.names.fadeIn)
      }, 2000)
    }
  }

  useEffect(() => {
    ToggleAnimation()
  }, [isLoading])
  return (
    <div className={`${DomManager.Animate.FadeIn(isLoading)} ${isLoading ? 'active' : ''} loading-overlay ${theme}`}>
      <div className="loading-animation"></div>
    </div>
  )
}

// <div className="loading">
//   <div className="loading-text">
//     <span className="loading-text-words">L</span>
//     <span className="loading-text-words">O</span>
//     <span className="loading-text-words">A</span>
//     <span className="loading-text-words">D</span>
//     <span className="loading-text-words">I</span>
//     <span className="loading-text-words">N</span>
//     <span className="loading-text-words">G</span>
//     <span className="loading-text-words">.</span>
//     <span className="loading-text-words">.</span>
//     <span className="loading-text-words">.</span>
//   </div>
// </div>