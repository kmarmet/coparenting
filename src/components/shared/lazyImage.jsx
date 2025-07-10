import React, {useEffect, useState} from 'react'
import {InView} from 'react-intersection-observer'
import AppImages from '../../constants/appImages'
import Manager from '../../managers/manager'

const LazyImage = ({imgName, alt, classes = '', onClick = () => {}}) => {
  const [isInViewport, setIsInViewport] = useState(false)
  const [src, setSrc] = useState('')

  const GetUrlByName = () => {
    const imgObj = FlattenObjects(AppImages, '', {})
    if (Manager.IsValid(imgName, true)) {
      if (Manager.IsValid(imgObj) && Manager.IsValid(imgObj, true)) {
        setSrc(imgObj[imgName])
      }
    }

    return ''
  }

  const FlattenObjects = (obj, prefix, result = {}) => {
    for (const key in obj) {
      const value = obj[key]
      const newKey = ''

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if ('name' in value && 'url' in value && Object.keys(value).length === 2) {
          // Case: { name, url }
          result[value.name] = value.url
        } else {
          // Continue recursion
          FlattenObjects(value, newKey, result)
        }
      } else {
        // Primitive value (e.g., string)
        result[newKey] = value
      }
    }
    return result
  }

  useEffect(() => {
    if (Manager.IsValid(imgName, true)) {
      GetUrlByName()
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
        <img className={`${classes}`} src={Manager.IsValid(src, true) ? src : ''} alt={alt} onClick={onClick} />
      </InView>
    </>
  )
}
export default LazyImage