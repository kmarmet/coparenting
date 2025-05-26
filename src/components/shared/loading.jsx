import React, {useEffect} from 'react'
import DomManager from '../../managers/domManager'

export default function Loading({theme = 'light', loadingText, isLoading}) {
  useEffect(() => {
    if (isLoading === true) DomManager.ToggleAnimation('add', 'loading-overlay', DomManager.AnimateClasses.names.fadeIn)
    else DomManager.ToggleAnimation('remove', 'loading-overlay', DomManager.AnimateClasses.names.fadeIn)
  }, [isLoading])
  return (
    <div className={`${isLoading === true ? 'loading-overlay active' : 'loading-overlay'} ${theme}`}>
      {isLoading && <img src={require('../../img/loading.svg')} alt="" />}
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