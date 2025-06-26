import React, {useEffect, useState} from 'react'
import {InView} from 'react-intersection-observer'
import AppImages from '../../constants/appImages'
import Manager from '../../managers/manager'

const LazyImage = ({imgName, alt, dynamicSrc = null, classes = '', onClick = () => {}}) => {
  const [isInViewport, setIsInViewport] = useState(false)
  const [src, setSrc] = useState('')

  useEffect(() => {
    if (Manager.IsValid(imgName, true)) {
      const url = AppImages.landing[imgName]?.url
      if (Manager.IsValid(url, true)) {
        setSrc(url)
      }
    } else {
      if (Manager.IsValid(dynamicSrc, true)) {
        setSrc(dynamicSrc)
      }
    }
  }, [imgName])

  return (
    <>
      {!Manager.IsValid(src, true) && !isInViewport && <div className={'skeleton'}></div>}
      <InView
        className={`lazy-image${classes ? ' ' + classes : ''}`}
        onChange={(inView, entry) => {
          if (inView) {
            setIsInViewport(true)
          }
        }}>
        <img className={`${classes}`} src={isInViewport ? src : ''} alt={alt} onClick={onClick} />
      </InView>
    </>
  )
}

export default LazyImage