import React, {useContext} from 'react'
import AppImages from '../../constants/appImages'
import globalState from '../../context'

export default function LoadingScreen() {
  const {state} = useContext(globalState)
  const {isLoading, loadingText} = state

  if (!isLoading) return null

  return (
    <div id={'loading-screen-wrapper'} className={isLoading ? 'active' : 'hidden'}>
      <img src={AppImages.misc.loadingGif.url} alt="Loading..." />
      <p>{loadingText ? loadingText : 'Preparing Your Pathway to Peace...'}</p>
    </div>
  )
}