export default function Label({ classes = '', children, text, required = false, icon = null, isBold = false }) {
  return (
    <div id="label-wrapper" className={`share-with-container ${classes}`}>
      <label className={isBold ? 'bold' : ''}>
        {icon ? icon : ''}
        {text}
        {required && <span className="asterisk">*</span>}
      </label>
      {children}
    </div>
  )
}
