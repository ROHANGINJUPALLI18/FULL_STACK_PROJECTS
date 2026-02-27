import React from "react";
import { FloatButton } from "antd";
import { useFloatingAddContext } from "@/context/FloatingAddButton";

export const FloatingActionButton = () => {
  const { setIsModalOpen } = useFloatingAddContext();

  return <FloatButton onClick={() => setIsModalOpen(true)} />;
};
