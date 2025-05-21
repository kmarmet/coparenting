import moment from 'moment'
import React, {useContext, useEffect, useRef} from 'react'
import {IoChevronBackCircleSharp, IoChevronForwardCircleSharp} from 'react-icons/io5'
import {LazyLoadImage} from 'react-lazy-load-image-component'
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

export default function Slideshow({activeIndex = 0, images = [], wrapperClasses = '', show = false, hide = () => {}}) {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  const {currentUser} = useCurrentUser()
  const {children} = useChildren()
  const {coparents} = useCoparents()
  const {parents} = useParents()
  const activeIndexRef = useRef(activeIndex)

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
      if (activeIndexRef.current < images.length - 1) {
        activeIndexRef.current = activeIndexRef.current + 1
      } else {
        activeIndexRef.current = 0
      }
    },
    onSwipedRight: () => {
      if (activeIndexRef.current > 0) {
        activeIndexRef.current = activeIndexRef.current - 1
      } else {
        activeIndexRef.current = images.length - 1
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
      if (activeIndexRef.current > 0) {
        activeIndexRef.current = activeIndexRef.current - 1
      } else {
        activeIndexRef.current = images.length - 1
      }
    } else {
      if (activeIndexRef.current < images.length - 1) {
        activeIndexRef.current = activeIndexRef.current + 1
      } else {
        activeIndexRef.current = 0
      }
    }
  }

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  return (
    <Overlay show={show}>
      <div {...handlers} id="slideshow-wrapper" style={DomManager.AnimateDelayStyle(1)} className={`${show ? 'active' : ''} ${wrapperClasses}`}>
        {/* LOOP IMAGES */}
        {Manager.IsValid(images) &&
          images.map((imageData, index) => {
            return (
              <div key={index} className={index === activeIndexRef.current && show ? 'active content' : 'content'}>
                {imageData?.title?.length > 0 && activeIndexRef.current === index && <p className={'title'}>{imageData?.title}</p>}
                {imageData?.notes?.length > 0 && activeIndexRef.current === index && <p className={'notes'}>{imageData?.notes}</p>}
                <LazyLoadImage
                  className={index === activeIndexRef.current && show ? 'active slideshow-image' : 'slideshow-image'}
                  src={imageData?.url}
                />
                {imageData?.date?.length > 0 && activeIndexRef.current === index && (
                  <p className={'capture-date'}>
                    Memory was captured on {moment(imageData?.date, DatetimeFormats.dateForDb).format(DatetimeFormats.readableMonthAndDayWithYear)}
                  </p>
                )}
                {Manager.IsValid(imageData?.ownerKey) && activeIndexRef.current === index && (
                  <p className={'shared-by'}>{GetOwnerName(imageData?.ownerKey)}</p>
                )}
              </div>
            )
          })}

        {/* NAVIGATION */}
        <div className="navigation">
          {images?.length > 1 && (
            <div className="arrows">
              <IoChevronBackCircleSharp onClick={() => Navigate('left')} />
              {activeIndexRef.current + 1} <span className="op-8">of</span> {images?.length}
              <IoChevronForwardCircleSharp onClick={() => Navigate('right')} />
            </div>
          )}
          <span className="close" onClick={hide}>
            CLOSE
          </span>
        </div>
      </div>
    </Overlay>
  )
}