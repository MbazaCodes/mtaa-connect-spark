import { jsxs, jsx } from "react/jsx-runtime";
import { useCallback, useContext, createContext } from "react";
import { toast, Bounce, ToastContainer } from "react-toastify";
const ToastContext = createContext(void 0);
const ToastProvider = ({ children }) => {
  const showToast = useCallback((message, type = "info") => {
    const options = {
      position: "top-right",
      autoClose: 5e3,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: void 0,
      theme: "light",
      transition: Bounce
    };
    switch (type) {
      case "success":
        toast.success(message, options);
        break;
      case "error":
        toast.error(message, options);
        break;
      case "warning":
        toast.warning(message, options);
        break;
      default:
        toast.info(message, options);
    }
  }, []);
  const showPromise = useCallback((promise, messages) => {
    return toast.promise(promise, messages, {
      position: "top-right",
      autoClose: 5e3,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }, []);
  return /* @__PURE__ */ jsxs(ToastContext.Provider, { value: { showToast, showPromise }, children: [
    children,
    /* @__PURE__ */ jsx(
      ToastContainer,
      {
        position: "top-right",
        autoClose: 5e3,
        hideProgressBar: false,
        newestOnTop: false,
        closeOnClick: true,
        rtl: false,
        pauseOnFocusLoss: true,
        draggable: true,
        pauseOnHover: true,
        theme: "light",
        transition: Bounce
      }
    )
  ] });
};
const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
export {
  ToastProvider,
  useToast
};
