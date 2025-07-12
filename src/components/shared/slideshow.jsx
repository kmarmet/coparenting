import moment from 'moment'
import React, {useContext, useEffect, useState} from 'react'
import {useSwipeable} from 'react-swipeable'
import ButtonThemes from '../../constants/buttonThemes'
import DatetimeFormats from '../../constants/datetimeFormats'
import globalState from '../../context'
import useChildren from '../../hooks/useChildren'
import useCoParents from '../../hooks/useCoParents'
import useCurrentUser from '../../hooks/useCurrentUser'
import useParents from '../../hooks/useParents'
import DatasetManager from '../../managers/datasetManager'
import Manager from '../../managers/manager'
import CardButton from './cardButton'

export default function Slideshow({activeIndex = 0, images = [], wrapperClasses = '', show = false, hide = () => {}}) {
    const {state, setState} = useContext(globalState)
    const {refreshKey} = state

    // App State
    const [activeImageIndex, setActiveImageIndex] = useState(activeIndex)
    const [activeImgHeight, setActiveImageHeight] = useState(0)
    const [activeImgWidth, setActiveImageWidth] = useState(0)
    // Hooks
    const {currentUser} = useCurrentUser()
    const {children} = useChildren()
    const {coParents} = useCoParents()
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
                name = coParents?.find((x) => x.userKey === key)?.name
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
    }, [activeIndex])

    useEffect(() => {
        if (Manager.IsValid(images)) {
            const newImage = new Image()
            newImage.src = DatasetManager.getUniqueArray(images, true)[activeImageIndex]?.url
            newImage.onload = () => {
                setActiveImageHeight(newImage.naturalHeight)
                setActiveImageWidth(newImage.naturalWidth)
            }
        }
    }, [activeImageIndex])

    return (
        <div id={'slideshow-wrapper'} className={`${show ? 'active' : ''}${wrapperClasses}`}>
            <div id="slideshow-overlay">
                <div
                    {...handlers}
                    id={'images-wrapper'}
                    style={{
                        backgroundImage: `url(${Manager.IsValid(images) ? images[activeImageIndex]?.url : ''})`,
                        height: `${activeImgHeight}px`,
                    }}
                    className={`${show ? 'active' : ''}`}>
                    {Manager.IsValid(images) &&
                        DatasetManager.getUniqueArray(images, true).map((imageData, index) => {
                            return (
                                <div key={index} className={index === activeImageIndex && show ? 'active content' : 'content'}>
                                    {/* IMAGE */}
                                    {Manager.IsValid(imageData?.notes, true) ||
                                        Manager.IsValid(imageData?.notes, true) ||
                                        (Manager.IsValid(imageData?.title, true) && (
                                            <div className={`${activeImgHeight > 700 ? 'top text' : 'regular text'}`}>
                                                {/* TITLE */}
                                                {imageData?.title?.length > 0 && activeImageIndex === index && (
                                                    <p className={'title'}>{imageData?.title}</p>
                                                )}

                                                {/* CAPTURE DATE */}
                                                {Manager.IsValid(imageData?.captureDate) && activeImageIndex === index && (
                                                    <p className={'capture-date'}>
                                                        Captured on{' '}
                                                        {moment(imageData?.captureDate, DatetimeFormats.dateForDb).format(
                                                            DatetimeFormats.readableMonthAndDayWithYear
                                                        )}
                                                    </p>
                                                )}

                                                {/* SHARED BY */}
                                                {Manager.IsValid(imageData?.ownerKey) && activeImageIndex === index && (
                                                    <p className={'shared-by'}>{GetOwnerName(imageData?.ownerKey)}</p>
                                                )}
                                                {/* NOTES */}
                                                {imageData?.notes?.length > 0 && activeImageIndex === index && (
                                                    <p className={'notes'}>{imageData?.notes}</p>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            )
                        })}
                </div>
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
                            <CardButton buttonTheme={ButtonThemes.white} classes="button close" onClick={hide} text={'Close'} />
                            <CardButton onClick={() => Navigate('right')} classes="button" text={'Next'} />
                        </>
                    )}
                    {images?.length === 1 && <CardButton buttonTheme={ButtonThemes.white} classes="button close" onClick={hide} text={'Close'} />}
                </div>
            </div>
        </div>
    )
}