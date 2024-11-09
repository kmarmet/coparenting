function ContentEditable({ onChange, classNames }) {
  return <div className={classNames} contentEditable onInput={onChange}></div>
}

export default ContentEditable
