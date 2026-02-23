import { toast } from 'sonner';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Upload, 
  Wallet, 
  Link,
  Loader2,
  Wifi,
  X
} from 'lucide-react';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

// Success toasts
export const successToast = {
  upload: (message?: string, options?: ToastOptions) => {
    const toastId = toast.success(message || "Upload successful!", {
      icon: <CheckCircle2 className="w-4 h-4 text-provn-success" />,
      duration: options?.duration || 5000,
      action: options?.action || {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  },
  
  transaction: (txHash: string, blockscoutUrl: string, options?: ToastOptions) => {
    const toastId = toast.success("Transaction confirmed!", {
      icon: <CheckCircle2 className="w-4 h-4 text-provn-success" />,
      description: `Hash: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
      duration: options?.duration || 7000,
      action: {
        label: "View",
        onClick: () => window.open(blockscoutUrl, '_blank'),
      },
      closeButton: true,
    });
    return toastId;
  },
  
  wallet: (message?: string, options?: ToastOptions) => {
    const toastId = toast.success(message || "Wallet connected successfully!", {
      icon: <Wallet className="w-4 h-4 text-provn-success" />,
      duration: options?.duration || 4000,
      action: options?.action || {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  },
  
  general: (message: string, options?: ToastOptions) => {
    const toastId = toast.success(message, {
      icon: <CheckCircle2 className="w-4 h-4 text-provn-success" />,
      duration: options?.duration || 4000,
      action: options?.action || {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  }
};

// Error toasts
export const errorToast = {
  upload: (message?: string, options?: ToastOptions) => {
    const toastId = toast.error(message || "Upload failed", {
      icon: <XCircle className="w-4 h-4 text-provn-error" />,
      duration: options?.duration || 6000,
      action: options?.action || {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  },
  
  wallet: (message?: string, options?: ToastOptions) => {
    const toastId = toast.error(message || "Wallet connection failed", {
      icon: <Wallet className="w-4 h-4 text-provn-error" />,
      duration: options?.duration || 6000,
      action: options?.action || {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  },
  
  network: (message?: string, options?: ToastOptions) => {
    const toastId = toast.error(message || "Network error", {
      icon: <Wifi className="w-4 h-4 text-provn-error" />,
      duration: options?.duration || 6000,
      action: options?.action || {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  },
  
  general: (message: string, options?: ToastOptions) => {
    const toastId = toast.error(message, {
      icon: <XCircle className="w-4 h-4 text-provn-error" />,
      duration: options?.duration || 5000,
      action: options?.action || {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  }
};

// Warning toasts
export const warningToast = {
  general: (message: string, options?: ToastOptions) => {
    const toastId = toast.warning(message, {
      icon: <AlertTriangle className="w-4 h-4 text-provn-warning" />,
      duration: options?.duration || 5000,
      action: options?.action || {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  },
  
  network: (message?: string, options?: ToastOptions) => {
    const toastId = toast.warning(message || "Please switch to BaseCAMP network", {
      icon: <Wifi className="w-4 h-4 text-provn-warning" />,
      duration: options?.duration || 6000,
      action: options?.action || {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  }
};

// Info toasts
export const infoToast = {
  general: (message: string, options?: ToastOptions) => {
    const toastId = toast.info(message, {
      icon: <Info className="w-4 h-4 text-provn-text" />,
      duration: options?.duration || 4000,
      action: options?.action || {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  },
  
  processing: (message?: string, options?: ToastOptions) => {
    const toastId = toast.info(message || "Processing...", {
      icon: <Loader2 className="w-4 h-4 text-provn-accent animate-spin" />,
      duration: options?.duration || 0, // No auto-dismiss for processing
      action: options?.action || {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  }
};

// Loading toasts (dismissible manually)
export const loadingToast = {
  upload: (message?: string) => {
    const toastId = toast.loading(message || "Uploading...", {
      icon: <Upload className="w-4 h-4 text-provn-accent animate-pulse" />,
      action: {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  },
  
  transaction: (message?: string) => {
    const toastId = toast.loading(message || "Transaction pending...", {
      icon: <Loader2 className="w-4 h-4 text-provn-accent animate-spin" />,
      action: {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  },
  
  wallet: (message?: string) => {
    const toastId = toast.loading(message || "Connecting wallet...", {
      icon: <Wallet className="w-4 h-4 text-provn-accent animate-pulse" />,
      action: {
        label: <X className="w-4 h-4" />,
        onClick: () => toast.dismiss(toastId),
      },
      closeButton: true,
    });
    return toastId;
  }
};

// Promise-based toasts for async operations
export const promiseToast = {
  upload: (promise: Promise<any>, messages?: {
    loading?: string;
    success?: string;
    error?: string;
  }) => {
    return toast.promise(promise, {
      loading: messages?.loading || "Uploading...",
      success: messages?.success || "Upload successful!",
      error: messages?.error || "Upload failed",
    });
  },
  
  transaction: (promise: Promise<any>, messages?: {
    loading?: string;
    success?: string;
    error?: string;
  }) => {
    return toast.promise(promise, {
      loading: messages?.loading || "Transaction pending...",
      success: messages?.success || "Transaction confirmed!",
      error: messages?.error || "Transaction failed",
    });
  }
};