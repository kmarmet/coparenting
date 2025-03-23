import React, { useEffect } from 'react'
import Manager from '../../managers/manager'

export default function Loading({ theme, loadingText, isLoading }) {
  useEffect(() => {
    const pageContainer = document.querySelector('.page-container')
    const pageOverlay = document.getElementById('page-overlay')

    if (pageContainer && pageOverlay) {
      if (isLoading) {
        pageOverlay.classList.add('active')
        pageContainer.classList.add('disable-scroll')
      } else {
        pageOverlay.classList.remove('active')
        pageContainer.classList.remove('disable-scroll')
      }
    }
  }, [isLoading])
  return (
    <div className={theme}>
      {Manager.isValid(loadingText, true) && <p>{loadingText}</p>}
      <img src={require('../../img/loading.gif')} alt="Loading" />
    </div>
  )
}