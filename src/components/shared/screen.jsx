import React, {useContext, useEffect, useMemo, useRef} from "react"
import ScreenNames from "../../constants/screenNames"
import globalState from "../../context"
import Manager from "../../managers/manager"

const Screen = ({activeScreen = "", stopLoadingBool, classes = "", children, loadingByDefault = false}) => {
    const {state} = useContext(globalState)
    const {setState} = useContext(globalState)
    const {currentScreen, refreshKey} = state

    const isLoading = useMemo(() => {
        return loadingByDefault && !stopLoadingBool
    }, [loadingByDefault, stopLoadingBool])

    const scrollRef = useRef(null)
    let isScrolling

    useEffect(() => {
        const navbar = document.getElementById("navbar")
        const handleScroll = () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    isScrolling = false
                })
                isScrolling = true
            }

            if (Manager.IsValid(navbar)) {
                if (scrollRef.current.scrollTop >= 150) {
                    if (activeScreen === ScreenNames.docViewer) {
                        navbar.classList.add("compact")
                    } else {
                        navbar.classList.add("hidden")
                    }
                } else {
                    navbar.classList.remove("hidden", "compact")
                }
            }
        }

        scrollRef.current.addEventListener("scroll", handleScroll)

        // Cleanup to avoid memory leaks
        return () => parent.removeEventListener("scroll", handleScroll)
    }, [currentScreen, isLoading, stopLoadingBool])

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
        <div className={`screen${Manager.IsValid(classes, true) ? ` ${classes}` : ""}`}>
            <div ref={scrollRef} className={`screen-content-wrapper${currentScreen === activeScreen || stopLoadingBool ? " active" : ""}`}>
                {children}
            </div>
        </div>
    )
}

export default Screen