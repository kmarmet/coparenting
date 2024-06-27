import React, { useState, useEffect, useContext } from "react";
import globalState from "../context";
import screenNames from "../constants/screenNames";
import util from "../util";
import { GoogleIconModule } from "google-icon";
export default function Menu() {
  const { state, setState } = useContext(globalState);
  const { currentScreen, menuIsOpen, currentUser } = state;

  const changeCurrentScreen = (screen) => {
    setState({
      ...state,
      currentScreen: screen,
      menuIsOpen: false,
      viewExpenseForm: false,
      currentScreenTitle: util.uppercaseFirstLetterInWord([screen.replace(/([a-z])([A-Z])/, "$1 $2")]),
    });
  };

  const logout = () => {
    localStorage.removeItem("rememberKey");
    setState({
      ...state,
      currentScreen: screenNames.login,
      currentUser: null,
      userIsLoggedIn: false,
    });
  };

  useEffect(() => {
    if (menuIsOpen) {
      document.getElementById("menu").classList.add("open");
      document.querySelector(".menu-icon-container").classList.add("open");
      setState({ ...state, menuIsOpen: true });
    } else {
      document.getElementById("menu").classList.remove("open");
      document.querySelector(".menu-icon-container").classList.remove("open");
      setState({ ...state, menuIsOpen: false });
    }
  }, [menuIsOpen]);

  return (
    <div id="menu">
      {/*  <span className="material-symbols-outlined">family_restroom</span>
      <google-icon name="favorite" class="md-3"></google-icon> */}

      <div id="menu-title">
        <p> Peaceful </p>
        <p><span>co</span>Parenting</p>
      </div>
      <div id="actions">
        <div className={`action ${currentScreen === screenNames.calendar ? "active" : ""}`} onClick={() => changeCurrentScreen(screenNames.calendar)}>
          <ion-icon name="calendar-outline"></ion-icon>
          <p>Shared Calendar</p>
        </div>
        <div className={`action ${currentScreen === screenNames.expenseTracker ? "active" : ""}`} onClick={() => changeCurrentScreen(screenNames.expenseTracker)}>
          <ion-icon name="cash-outline"></ion-icon>
          <p>Expense Tracker</p>
        </div>
        <div className={`action ${currentScreen === screenNames.swapRequests ? "active" : ""}`} onClick={() => changeCurrentScreen(screenNames.swapRequests)}>
          <ion-icon name="swap-horizontal-outline"></ion-icon>
          <p>Swap Requests</p>
        </div>
        <div className={`action ${currentScreen === screenNames.agreement ? "active" : ""}`} onClick={() => changeCurrentScreen(screenNames.agreement)}>
          <ion-icon name="document-text-outline"></ion-icon>
          <p>View Agreement</p>
        </div>
        <div className={`action ${currentScreen === screenNames.profile ? "active" : ""}`} onClick={() => changeCurrentScreen(screenNames.profile)}>
          <ion-icon name="person-circle-outline"></ion-icon>
          <p>Profile</p>
        </div>
        <div className={`action`} onClick={logout}>
          <ion-icon name="log-out-outline"></ion-icon> <p>Logout</p>
        </div>
      <p id="pwa-steps" onClick={() => setState({...state, showPwaSteps: true})}>
        Install App
      </p>
      </div>
      {/* <div className={`action ${currentScreen === "memories" ? "active" : ""}`}>
        <ion-icon name="images-outline"></ion-icon>
        <p>Memories</p>
      </div>
      <div className={`action ${currentScreen === "infoBank" ? "active" : ""}`}>
        <ion-icon name="information-circle-outline"></ion-icon>
        <p>Info Bank</p>
      </div> */}
    </div>
  );
}
