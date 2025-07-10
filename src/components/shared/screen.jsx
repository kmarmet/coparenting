import React, {useContext, useEffect, useMemo} from 'react'
import globalState from '../../context'
import Manager from '../../managers/manager'

const Screen = ({activeScreen = '', stopLoadingBool, classes = '', children, loadingByDefault = false}) => {
    const {state} = useContext(globalState)
    const {setState} = useContext(globalState)
    const {currentScreen, refreshKey} = state

    const isLoading = useMemo(() => {
        return loadingByDefault && !stopLoadingBool
    }, [loadingByDefault, stopLoadingBool])

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
        }, 15000)
    }, [isLoading, currentScreen])

    return (
        <div className={`screen${Manager.IsValid(classes, true) ? ` ${classes}` : ''}`}>
            <div className={`screen-content-wrapper${currentScreen === activeScreen || stopLoadingBool ? ' active' : ''}`}>{children}</div>
        </div>
    )
}

export default Screen