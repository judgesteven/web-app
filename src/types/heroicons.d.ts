declare module '@heroicons/react/outline' {
  import { FC, SVGProps } from 'react'

  export interface IconProps extends SVGProps<SVGSVGElement> {
    title?: string
    titleId?: string
  }

  export const ChevronUpIcon: FC<IconProps>
  export const ChevronDownIcon: FC<IconProps>
  export const CheckIcon: FC<IconProps>
  export const ChevronDoubleUpIcon: FC<IconProps>
  export const ChevronDoubleDownIcon: FC<IconProps>
  // Add any other icons you might need in the future
}

// Also declare the root module to be safe
declare module '@heroicons/react' {
  export * from '@heroicons/react/outline'
} 