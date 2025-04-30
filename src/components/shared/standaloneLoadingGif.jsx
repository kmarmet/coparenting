import React from 'react'

const StandaloneLoadingGif = () => {
  return (
    <div id="standalone-loading-overlay">
      <img className="data-loading-gif " src={require('../../img/loading.gif')} alt="Loading" />
    </div>
  )
}

export default StandaloneLoadingGif