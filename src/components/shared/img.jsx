import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'

const Img = ({src, alt, classes = '', onClick = () => {}}) => {
  const {state, setState} = useContext(globalState)
  const {theme, currentScreen, authUser} = state
  const [showContent, setShowContent] = useState(false)
  const [isValidImage, setIsValidImage] = useState(false)
  const [imgLoadingFailed, setImgLoadingFailed] = useState(false)

  const OnSuccess = () => {
    setShowContent(true)
    setIsValidImage(true)
    // console.log(`Image loaded: ${src}`)
  }

  const OnError = () => {
    // console.log(`Image failed to load: ${src}`)
    setShowContent(false)
    setIsValidImage(false)
    setImgLoadingFailed(true)``
  }

  const ValidateImageSrc = async () => {
    await fetch(src)
      .then((response) => {
        if (response.ok) {
          OnSuccess()
        } else {
          OnError()
        }
      })
      .catch(() => {
        OnError()
      })
  }

  useEffect(() => {
    if (Manager.IsValid(src, true)) {
      ValidateImageSrc().then((r) => r)
    }
  }, [src])

  return (
    <>
      {showContent && isValidImage && !imgLoadingFailed && <img onClick={onClick} className={`local-image ${classes}`} src={src} alt={alt} />}
      {!showContent && !isValidImage && !imgLoadingFailed && <div className={'skeleton'}></div>}
      {!isValidImage && !showContent && imgLoadingFailed && (
        <img className={'local-image'} src={require('../../img/broken-image-placeholder.png')} alt="Loading" />
      )}
    </>
  )
}

export default Img