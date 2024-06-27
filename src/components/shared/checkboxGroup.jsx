import React, { useEffect, useState, useContext, useRef } from "react";
import moment from "moment";

export default function CheckboxGroup({ labels, onCheck }) {
  return (
    <div id="checkbox-group">
      {labels &&
        labels.length > 0 &&
        labels.map((label, index) => {
          return (
            <div data-label={label} className="flex" key={index} onClick={(e) => onCheck(e)}>
              <div className="box">
                <span className="checkmark-icon material-icons-round">check</span>
              </div>
              <span>{label}</span>
            </div>
          );
        })}
    </div>
  );
}
