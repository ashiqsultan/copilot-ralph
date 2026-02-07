import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'

function cn(...args) {
  return twMerge(clsx(args))
}

export default cn
