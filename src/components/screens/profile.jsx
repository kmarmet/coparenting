import React, { useState, useEffect, useContext } from "react";
import db from "../../db";
import globalState from "../../context";
import Error from "../shared/error";
import util from "../../util";
import SmsUtil from "../../smsUtil";
import screenNames from "../../constants/screenNames";

export default function Profile() {
  const { state, setState } = useContext(globalState);
  const { currentUser } = state;
  const [error, setError] = useState(null);

  useEffect(() => {
    util.scrollToTopOfPage();
    setState({ ...state, currentScreenTitle: "Forgot Password" });
  }, []);

  return (
    <div id="profile-container" className="page-container">
      <Error errorMessage={error} />
      <div id="children-container">
        {currentUser &&
          currentUser.children &&
          currentUser.children.length > 0 &&
          currentUser.children.map((child, index) => {
            console.log(child);
            return (
              <div key={index} className="child">
                <ion-icon name="person-circle"></ion-icon>
                <span>{child}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
