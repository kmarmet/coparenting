import React, {useContext, useEffect, useState} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import Storage from '../../database/storage'
import AppImageNames from '../../constants/appImageNames'
import {LazyLoadImage} from 'react-lazy-load-image-component'

const Img = ({src, alt, classes = '', onClick = () => {}}) => {
  const {state, setState} = useContext(globalState)
  const {theme, currentScreen, authUser} = state
  const [showContent, setShowContent] = useState(false)
  const [isValidImage, setIsValidImage] = useState(false)
  const [imgLoadingFailed, setImgLoadingFailed] = useState(false)
  const [brokenImagePlaceholder, setBrokenImagePlaceholder] = useState('')

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

  const SetImagePlaceholder = async () => {
    const images = await Storage.GetAppImages(AppImageNames.dirs.landing)
    if (Manager.IsValid(images)) {
      setBrokenImagePlaceholder(images.find((x) => x.name === StringManager.removeFileExtension(AppImageNames.misc.brokenImagePlaceholder))?.url)
    }
  }

  useEffect(() => {
    SetImagePlaceholder().then((r) => r)
    if (Manager.IsValid(src, true)) {
      ValidateImageSrc().then((r) => r)
    }
  }, [src])

  return (
    <>
      {/* Image is validated and loaded */}
      {showContent && isValidImage && !imgLoadingFailed && <LazyLoadImage wrapperClassName={classes} src={src} alt={alt} onClick={onClick} />}

      {/* Image placeholder */}
      {!showContent && !isValidImage && !imgLoadingFailed && <div className={'skeleton'}></div>}

      {/* Image is validated but failed to load */}
      {!isValidImage && !showContent && imgLoadingFailed && <img className={'local-image'} src={brokenImagePlaceholder} alt="Image" />}
    </>
  )
}

export default Img