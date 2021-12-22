/**
 * 弹出toast
 * @param text 内容
 * @param level 为Error时显示红色
 */
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import { MESSAGE_TOAST_LEVEL_ERROR } from "./message";

export const toast = async (text, level) => {
  const css =
    level === MESSAGE_TOAST_LEVEL_ERROR
      ? {
          style: {
            color: "rgba(239, 68, 68, 1)",
            textAlign: "center",
            borderColor: "rgba(248, 113, 113, 1)",
            borderWidth: "1px",
            borderRadius: "0.375rem",
            background: "rgba(254, 242, 242, 1)",
          },
        }
      : {
          style: {
            color: "rgba(59, 130, 246, 1)",
            textAlign: "center",
            borderColor: "rgba(96, 165, 250, 1)",
            borderWidth: "1px",
            borderRadius: "0.375rem",
            background: "rgba(239, 246, 255, 1)",
          },
        };

  Toastify({
    text: text,
    duration: 3000,
    style: css.style,
    close: true,
    position: "center",
    offset: {
      y: 200, // vertical axis - can be a number or a string indicating unity. eg: '2em'
    },
  }).showToast();
};
