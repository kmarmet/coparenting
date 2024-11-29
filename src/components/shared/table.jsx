import * as React from 'react'
import Manager from '@manager'

export default function Table({ headers, rows }) {
  return (
    <div id="table-wrapper">
      <div id="headers" className="flex">
        {Manager.isValid(headers, true) &&
          headers.map((header, index) => {
            return <span>{header}</span>
          })}
      </div>
      <div id="rows"></div>
    </div>
  )
}