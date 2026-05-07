import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "AI提示词生成器 V3",
  description: "Clean-room prompt MLOps workbench with old-vs-new comparison.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
