import React from 'react'

export default function Loading({ isLoading, theme }) {
  return (
    <div className={`${isLoading === true ? 'loading-overlay active' : 'loading-overlay'} ${theme}`}>
      <img src={require('../../img/loading.gif')} alt="Loading" />
    </div>
  )
}