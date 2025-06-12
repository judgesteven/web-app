import { FC, SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> {
  title?: string
  titleId?: string
}

declare module '@heroicons/react/outline' {
  export const ChevronUpIcon: FC<IconProps>
  export const ChevronDownIcon: FC<IconProps>
  export const CheckIcon: FC<IconProps>
  export const ChevronDoubleUpIcon: FC<IconProps>
  export const ChevronDoubleDownIcon: FC<IconProps>
}

declare module '@heroicons/react'; 