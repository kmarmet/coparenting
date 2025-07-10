import React, {useEffect} from 'react'
import {HiMiniRocketLaunch} from 'react-icons/hi2'
import AppImages from '../../constants/appImages'
import ButtonThemes from '../../constants/buttonThemes'
import Manager from '../../managers/manager'
import CardButton from './cardButton'
import LazyImage from './lazyImage'

const AppUpdateOverlay = () => {
    const appUpdateOverlay = document.getElementById('app-update-overlay')
    const loadingScreen = document.getElementById('loading-screen-wrapper')

    useEffect(() => {
        if (Manager.IsValid(appUpdateOverlay) && appUpdateOverlay.classList.contains('show') && Manager.IsValid(loadingScreen)) {
            if (Manager.IsValid(loadingScreen)) {
                loadingScreen.classList.add('hidden')
            }
        }
    }, [appUpdateOverlay])

    return (
        <div id={'app-update-overlay'} className="hidden">
            <div id="stars"></div>
            <div id="stars2"></div>
            <div id="stars3"></div>

            <div className="content">
                <div className="animation"></div>
                <LazyImage imgName={AppImages.misc.launch.name} alt="App is Updating!" classes={'takeoff-gif'} />
            </div>
            <div
                className="card-buttons"
                onClick={(e) => {
                    const button = document.querySelector('.card-button')
                    button.classList.add('animate')
                    setTimeout(() => {
                        window.location.reload()
                    }, 800)
                }}>
                <CardButton buttonTheme={ButtonThemes.lightPurple} text={'Launch Update'} icon={<HiMiniRocketLaunch />}></CardButton>
            </div>
        </div>
    )
}

export default AppUpdateOverlay