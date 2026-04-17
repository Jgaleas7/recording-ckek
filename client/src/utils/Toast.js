import { toast } from "react-toastify";

const Toast = ({ message, type }) => {
  switch (type) {
    case "success":
      return toast.success(message, {
        position: "top-right",
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
        theme: "light",
      });
    case "info":
      return toast.info(message, {
        position: "top-right",
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
        theme: "light",
      });
    case "warning":
      return toast.warning(message, {
        position: "top-right",
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
        theme: "light",
      });
    case "error":
      return toast.error(message, {
        position: "top-right",
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
        theme: "light",
      });

    default:
      return toast(message, {
        position: "top-right",
        autoClose: 5000,
        closeOnClick: true,
        pauseOnHover: true,
        theme: "light",
      });
  }
};

export default Toast;
