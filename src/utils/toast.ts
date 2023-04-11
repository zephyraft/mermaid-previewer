import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'
import { ToastType } from '../types'

export const toast = async (text: string, level: ToastType): Promise<void> => {
  const commonStyle = {
    textAlign: 'center',
    borderColor: 'rgb(229, 231, 235)',
    borderWidth: '1px',
    borderRadius: '1rem'
  }

  const css =
        level === ToastType.ERROR
          ? {
              style: {
                color: 'rgb(71, 0, 0)',
                background: 'rgb(248, 114, 114)',
                ...commonStyle
              }
            }
          : {
              style: {
                color: 'rgb(0, 43, 61)',
                background: 'rgb(58, 191, 248)',
                ...commonStyle
              }
            }

  console.log(css.style)

  Toastify({
    text,
    duration: 5000,
    style: css.style,
    close: true,
    position: 'center',
    offset: {
      x: 0,
      y: 200 // vertical axis - can be a number or a string indicating unity. eg: '2em'
    }
  }).showToast()
}
