import React from 'react'
import AppImages from '../../constants/appImages'
import LazyImage from './lazyImage'

const AppUpdateOverlay = () => {
  return (
    <div id={'app-update-overlay'}>
      <div className="content">
        <p>Launching New Update...</p>
        <LazyImage imgName={AppImages.misc.launch.name} alt="App is Updating!" classes={'takeoff-gif'} />
      </div>
    </div>
  )
}

export default AppUpdateOverlay