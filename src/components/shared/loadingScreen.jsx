import React, {useContext} from 'react'
import globalState from '../../context'

export default function LoadingScreen() {
    const {state, setState} = useContext(globalState)

    const {isLoading} = state

    return (
        <div
            id={'loading-screen-wrapper'}
            className={`${isLoading ? 'active' : 'hidden'} loading-screen`}
            onClick={(e) => {
                setState({...state, isLoading: false, showOverlay: false})
            }}>
            <div className="animation"></div>
        </div>
    )
}