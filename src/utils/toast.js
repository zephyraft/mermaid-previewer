/**
 * 弹出toast
 * @param text 内容
 * @param level 为Error时显示红色
 */
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import { MESSAGE_TOAST_LEVEL_ERROR } from "./message";

export const toast = async (text, level) => {
  const commonStyle = {
    textAlign: "center",
    borderColor: "rgb(229, 231, 235)",
    borderWidth: "1px",
    borderRadius: "1rem",
  }

  const css =
    level === MESSAGE_TOAST_LEVEL_ERROR
      ? {
          style: {
            color: "rgb(71, 0, 0)",
            background: "rgb(248, 114, 114)",
            ...commonStyle,
          },
        }
      : {
          style: {
            color: "rgb(0, 43, 61)",
            background: "rgb(58, 191, 248)",
            ...commonStyle,
          },
        };

  console.log(css.style)

  Toastify({
    text: text,
    duration: 13000,
    style: css.style,
    close: true,
    position: "center",
    offset: {
      y: 200, // vertical axis - can be a number or a string indicating unity. eg: '2em'
    },
  }).showToast();
};
