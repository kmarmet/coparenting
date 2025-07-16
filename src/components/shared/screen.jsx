import React, {useContext, useEffect, useMemo, useRef} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'

const Screen = ({activeScreen = '', stopLoadingBool, classes = '', children, loadingByDefault = false}) => {
    const {state} = useContext(globalState)
    const {setState} = useContext(globalState)
    const {currentScreen, refreshKey} = state

    const isLoading = useMemo(() => {
        return loadingByDefault && !stopLoadingBool
    }, [loadingByDefault, stopLoadingBool])

    const scrollRef = useRef(null)
    let isScrolling

    useEffect(() => {
        const container = scrollRef.current
        if (!container) return

        console.log(container)

        const screenHeight = window.innerHeight
        const halfHeight = screenHeight / 2
        const navbar = document.getElementById('navbar')

        const handleScroll = () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    isScrolling = false
                })
                isScrolling = true
            }
            if (container.scrollTop >= 300) {
                navbar.classList.add('hidden')
            } else {
                navbar.classList.remove('hidden')
            }
        }

        container.addEventListener('scroll', handleScroll)

        // Cleanup to avoid memory leaks
        return () => container.removeEventListener('scroll', handleScroll)
    }, [currentScreen, isLoading])

    useEffect(() => {
        setState((prev) => ({
            ...prev,
            isLoading,
        }))

        // Add a timeout to prevent the loading screen from showing for too long
        setTimeout(() => {
            if (isLoading) {
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                }))
            }
        }, 10000)
    }, [isLoading, currentScreen])

    return (
        <div ref={scrollRef} className={`screen${Manager.IsValid(classes, true) ? ` ${classes}` : ''}`}>
            <div className={`screen-content-wrapper${currentScreen === activeScreen || stopLoadingBool ? ' active' : ''}`}>{children}</div>
        </div>
    )
}

export default Screen