export default function Label({ classes = '', children, text, required = false, icon = null }) {
  return (
    <div className={`share-with-container ${classes}`}>
      <label>
        {icon ? icon : ''}
        <span>
          {text}
          {required ? <span className="asterisk">*</span> : ''}
        </span>
      </label>
      {children}
    </div>
  )
}