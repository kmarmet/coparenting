import React, { useEffect } from 'react'
import Manager from '../../managers/manager'

export default function Loading({ theme, loadingText, isLoading }) {
  return (
    <div className={`${isLoading === true ? 'loading-overlay active' : 'loading-overlay'} ${theme}`}>
      {Manager.isValid(loadingText, true) && <p>{loadingText}</p>}
      <img src={require('../../img/loading.gif')} alt="Loading" />
    </div>
  )
}