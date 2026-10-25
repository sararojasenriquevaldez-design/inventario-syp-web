// Campo de contraseña con botón "Mostrar" (docs/UI-UX.md §5.1).
import { useState, type ComponentProps } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/componentes/ui/input-group'

type Props = Omit<ComponentProps<'input'>, 'type'>

export function CampoPassword(props: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <InputGroup>
      <InputGroupInput type={visible ? 'text' : 'password'} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
          {visible ? 'Ocultar' : 'Mostrar'}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
