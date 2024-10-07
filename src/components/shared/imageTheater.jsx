import React, { useState, useEffect, useContext } from 'react'
import globalState from '../../context'
import Manager from '@manager'
import { useSwipeable } from 'react-swipeable'

function ImageTheater({ onOpen, showTheater = false, imgArray, title, subtitle = '', defaultImageIndex, className = '', onClose }) {
  const [popupImageIndex, setPopupImageIndex] = useState(defaultImageIndex)
  const [imgHeight, setImgHeight] = useState(0)
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
    if (!className.toString().contains('active')) {
      Manager.toggleForModalOrNewForm('show')
    } else {
      Manager.toggleForModalOrNewForm('hide')
    }
  }, [className])

  useEffect(() => {
    if (onOpen) {
      onOpen()
    }
  }, [])

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
          Manager.toggleForModalOrNewForm('show')
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
                <img data-img-index={popupImageIndex} src={image.url} />
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
