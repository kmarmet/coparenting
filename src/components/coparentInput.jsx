import React, { useState, useEffect, useContext, Fragment } from "react";
import CheckboxGroup from "./shared/checkboxGroup";

export default function CoparentInputs({
  handleCoparentType,
  coparentsLength = 1,
}) {
  return (
    <div className="coparent-input-container">
      <p id="coparent-label">Co-Parent #{coparentsLength}</p>
      <input type="text" className="coparent-name" placeholder="Name" />
      <input
        className="coparent-phone"
        type="number"
        pattern="[0-9]*"
        inputMode="numeric"
        placeholder="Phone number"
      />
      <CheckboxGroup
        className="coparent-type"
        labels={["Step-Parent", "Biological Parent"]}
        onCheck={handleCoparentType}
      />
    </div>
  );
}
