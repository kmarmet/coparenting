import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {useSwipeable} from 'react-swipeable'
import DatetimeFormats from '../../constants/datetimeFormats'
import globalState from '../../context'
import useChildren from '../../hooks/useChildren'
import useCoparents from '../../hooks/useCoparents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useParents from '../../hooks/useParents'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import Overlay from './overlay'
import CardButton from './cardButton'
import ButtonThemes from '../../constants/buttonThemes'

export default function Slideshow({activeIndex = 0, images = [], wrapperClasses = '', show = false, hide = () => {}}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  const [activeImageIndex, setActiveImageIndex] = useState(activeIndex)
  const {currentUser} = useCurrentUser()
  const {children} = useChildren()
  const {coparents} = useCoparents()
  const {parents} = useParents()

  const handlers = useSwipeable({
    delta: {
      down: 250,
      left: 120,
      right: 120,
    },
    preventScrollOnSwipe: true,
    onSwipedDown: () => {
      // console.log('User Swiped!', )
      hide()
    },
    onSwipedLeft: () => {
      if (activeImageIndex < images.length - 1) {
        setActiveImageIndex(activeImageIndex + 1)
      } else {
        setActiveImageIndex(0)
      }
    },
    onSwipedRight: () => {
      if (activeImageIndex > 0) {
        setActiveImageIndex(activeImageIndex - 1)
      } else {
        setActiveImageIndex(images.length - 1)
      }
    },
    onSwipedUp: () => {
      hide()
    },
  })

  const GetOwnerName = (key) => {
    if (key === currentUser?.key) return ''

    // Parent
    if (currentUser?.accountType === 'parent') {
      // Child name
      let name = children?.find((x) => x.userKey === key)?.general?.name

      // Co-parent name
      if (!Manager.IsValid(name)) {
        name = coparents?.find((x) => x.userKey === key)?.name
      }
      return `Shared by: ${name}`
    }

    // Child
    else {
      const name = parents?.find((x) => x.userKey === key)?.name
      return `Shared by: ${name}`
    }
  }

  const Navigate = (direction) => {
    if (direction === 'left') {
      if (activeImageIndex > 0) {
        setActiveImageIndex(activeImageIndex - 1)
      } else {
        setActiveImageIndex(images.length - 1)
      }
    } else {
      if (activeImageIndex < images.length - 1) {
        setActiveImageIndex(activeImageIndex + 1)
      } else {
        setActiveImageIndex(0)
      }
    }
  }

  useEffect(() => {
    setActiveImageIndex(activeIndex)
    console.log(images)
  }, [activeIndex])

  return (
    <Overlay show={show}>
      <div {...handlers} style={DomManager.AnimateDelayStyle(1)} className={`${show ? 'active' : ''} slideshow-wrapper`}>
        {Manager.IsValid(images) &&
          images.map((imageData, index) => {
            return (
              <div key={index} className={index === activeImageIndex && show ? 'active content' : 'content'}>
                {imageData?.title?.length > 0 && activeImageIndex === index && <p className={'title'}>{imageData?.title}</p>}
                {imageData?.notes?.length > 0 && activeImageIndex === index && <p className={'notes'}>{imageData?.notes}</p>}
                <img src={imageData?.url} alt="" />

                {imageData?.date?.length > 0 && activeImageIndex === index && (
                  <p className={'capture-date'}>
                    Memory was captured on {moment(imageData?.date, DatetimeFormats.dateForDb).format(DatetimeFormats.readableMonthAndDayWithYear)}
                  </p>
                )}
                {Manager.IsValid(imageData?.ownerKey) && activeImageIndex === index && (
                  <p className={'shared-by'}>{GetOwnerName(imageData?.ownerKey)}</p>
                )}
              </div>
            )
          })}
        {/* NAVIGATION */}
        {images?.length > 1 && (
          <p className="count">
            {activeImageIndex + 1} <span className="op-8">of</span> {images?.length}
          </p>
        )}
        <div className={`navigation ${images?.length < 2 ? 'full-width' : ''}`}>
          {images?.length > 1 && (
            <>
              <CardButton onClick={() => Navigate('left')} classes="button" text={'Previous'} />
              <CardButton buttonType={ButtonThemes.white} classes="button close" onClick={hide} text={'Close'} />
              <CardButton onClick={() => Navigate('right')} classes="button" text={'Next'} />
            </>
          )}
          {images?.length === 1 && <CardButton buttonType={ButtonThemes.white} classes="button close" onClick={hide} text={'Close'} />}
        </div>
      </div>
    </Overlay>
  )
}