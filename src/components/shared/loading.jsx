import React from 'react'
import Manager from '../../managers/manager'

export default function Loading({theme = 'light', loadingText, isLoading}) {
  return (
    <div className={`${isLoading === true ? 'loading-overlay active' : 'loading-overlay'} ${theme}`}>
      {Manager.isValid(loadingText, true) && <p>{loadingText}</p>}
      {isLoading && <img src={require('../../img/loading.gif')} alt="Loading" />}
    </div>
  )
}