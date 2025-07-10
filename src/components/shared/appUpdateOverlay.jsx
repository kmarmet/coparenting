import React, {useEffect, useState} from 'react'
import AppImages from '../../constants/appImages'
import LazyImage from './lazyImage'

const AppUpdateOverlay = () => {
    const [count, setCount] = useState(3)

    useEffect(() => {
        const loadingScreenWrapper = document.getElementById('loading-screen-wrapper')

        if (loadingScreenWrapper) {
            loadingScreenWrapper.remove()
        }
        if (count <= 1) {
            if (!window.location.href.includes('localhost')) {
                window.location.reload()
            }
            return
        }

        const timer = setTimeout(() => setCount((prev) => prev - 1), 1000)

        return () => clearTimeout(timer)
    }, [count])

    return (
        <div id={'app-update-overlay'}>
            <div className="content">
                <div className="animation"></div>
                <div className="count-wrapper">
                    <p className="count">{count}</p>
                </div>
                <LazyImage imgName={AppImages.misc.launch.name} alt="App is Updating!" classes={'takeoff-gif'} />
            </div>
        </div>
    )
}

export default AppUpdateOverlay