import React, {useContext} from 'react'
import globalState from '../../context'

export default function LoadingScreen() {
    const {state} = useContext(globalState)
    const {isLoading} = state

    return (
        <div id={'loading-screen-wrapper'} className={`${isLoading ? 'active' : 'hidden'} loading-screen`}>
            <div className="animation"></div>
        </div>
    )
}