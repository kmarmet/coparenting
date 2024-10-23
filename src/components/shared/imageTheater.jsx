import React, { useState, useEffect, useContext } from 'react'
import globalState from '../../context'
import Manager from '@manager'
import { useSwipeable } from 'react-swipeable'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  displayAlert,
  uniqueArray,
  getFileExtension,
} from '../../globalFunctions'
import manager from '@manager'
function ImageTheater({ onOpen, showTheater = false, imgArray, title, subtitle = '', defaultImageIndex = 0, className = '', onClose }) {
  const [popupImageIndex, setPopupImageIndex] = useState(defaultImageIndex)
  const allImages = document.querySelectorAll('.image-wrapper')

  const handlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      setPopupImageIndex((popupImageIndex) => popupImageIndex - 1)
    },
    onSwipedRight: () => {
      setPopupImageIndex((popupImageIndex) => popupImageIndex + 1)
    },
  })

  useEffect(() => {
    if (contains(className.toString(), 'active')) {
      Manager.showPageContainer('show')
    } else {
      Manager.showPageContainer('hide')
    }
  }, [className])

  useEffect(() => {
    if (onOpen) {
      onOpen()
    }
  }, [])

  useEffect(() => {
    const allImages = document.querySelectorAll('.theater-image')
    if (Manager.isValid(allImages, true)) {
      allImages.forEach((img) => img.classList.remove('active'))
      const nextImage = allImages[popupImageIndex]

      if (nextImage) {
        nextImage.classList.add('active')
      }
    }
  }, [popupImageIndex])

  useEffect(() => {
    setPopupImageIndex(defaultImageIndex)
  }, [defaultImageIndex])

  return (
    <div className={`${className} ${showTheater ? 'active' : ''}`} id="image-theater-wrapper">
      {/* CLOSE ARROW */}
      <span
        className="material-icons-round"
        id="close-icon"
        onClick={() => {
          onClose()
          Manager.showPageContainer('show')
        }}>
        expand_more
      </span>

      {imgArray[popupImageIndex || 0]?.title ? <p className="title">{imgArray[popupImageIndex || 0]?.title}</p> : ''}
      {/* CARD */}
      <div id="card">
        <p id="subtitle">{subtitle}</p>
        {Manager.isValid(imgArray, true) &&
          imgArray.map((image, index) => {
            return (
              <div {...handlers} key={index} className={popupImageIndex === index ? 'active image-wrapper' : 'image-wrapper'}>
                <img data-img-index={popupImageIndex} className={'theater-image'} src={image.url} />
              </div>
            )
          })}
      </div>
      {imgArray[popupImageIndex || 0]?.notes ? <p className="notes">{imgArray[popupImageIndex]?.notes}</p> : ''}

      {/* NAVIGATION ARROWS */}
      {popupImageIndex > 0 && (
        <span id="left-arrow" className="material-icons-round" onClick={() => setPopupImageIndex((popupImageIndex) => popupImageIndex - 1)}>
          arrow_back_ios
        </span>
      )}
      {popupImageIndex < allImages.length - 1 && (
        <span
          id="right-arrow"
          className="material-icons-round"
          onClick={() => {
            if (popupImageIndex < imgArray.length) {
              setPopupImageIndex((popupImageIndex) => popupImageIndex + 1)
            }
          }}>
          arrow_forward_ios
        </span>
      )}
    </div>
  )
}

export default ImageTheater
