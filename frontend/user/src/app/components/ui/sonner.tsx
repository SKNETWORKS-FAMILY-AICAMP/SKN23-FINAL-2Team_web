"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      position="top-center"
      theme="light"
      className="toaster group"
      toastOptions={{
        style: {
          background: "white",
          color: "black",
          border: "1px solid #e4e4e7",
        }
      }}
      {...props}
    />
  );
};

export { Toaster };
