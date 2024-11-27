import Label from './label'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'

export default function SelectDropdown({ wrapperClasses, onChange, labelText, labelClasses, children, selectValue }) {
  return (
    <div className={wrapperClasses}>
      <Label isBold={true} text={labelText} classes={labelClasses}></Label>
      <FormControl fullWidth>
        <Select className={'w-100'} value={selectValue} onChange={onChange}>
          {children}
        </Select>
      </FormControl>
    </div>
  )
}