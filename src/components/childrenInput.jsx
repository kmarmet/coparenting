import React, { useState, useEffect, useContext, Fragment } from "react";

export default function ChildrenInput({ onChange, childrenCount }) {
  return (
    <input
      type="text"
      placeholder={`Child ${childrenCount} name`}
      autoComplete="off"
      onChange={onChange}
    />
  );
}
