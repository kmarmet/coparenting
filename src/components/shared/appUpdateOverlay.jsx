import React from "react"
import {HiMiniRocketLaunch} from "react-icons/hi2"
import AppImages from "../../constants/appImages"
import ButtonThemes from "../../constants/buttonThemes"
import useDetectElement from "../../hooks/useDetectElement"
import Manager from "../../managers/manager"
import CardButton from "./cardButton"
import LazyImage from "./lazyImage"

const AppUpdateOverlay = () => {
      const appUpdateOverlay = document.getElementById("app-update-overlay")

      // Disable Loading Screen when app update overlay is open
      useDetectElement(".loading-screen", (e) => {
            const loadingScreenWrapper = e
            if (Manager.IsValid(appUpdateOverlay) && appUpdateOverlay.classList.contains("show") && Manager.IsValid(loadingScreenWrapper)) {
                  loadingScreenWrapper.remove()
            }
      })

      return (
            <div id={"app-update-overlay"}>
                  <div id="stars"></div>
                  <div id="stars2"></div>
                  <div id="stars3"></div>

                  <div className="content">
                        <div className="animation"></div>
                        <LazyImage imgName={AppImages.misc.launch.name} alt="App is Updating!" classes={"takeoff-gif"} />
                  </div>
                  <div
                        className="card-buttons"
                        onClick={(e) => {
                              const button = document.querySelector(".card-button")
                              button.classList.add("animate")
                              window.location.reload()
                        }}>
                        <CardButton buttonTheme={ButtonThemes.lightPurple} text={"Launch Update"} icon={<HiMiniRocketLaunch />}></CardButton>
                  </div>
            </div>
      )
}

export default AppUpdateOverlay