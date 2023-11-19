"use client"

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { BiMoon, BiSun } from "react-icons/bi";


export const ThemeController = () => {
  const [mounted, setMounted] = useState(false);
  const { systemTheme, theme, setTheme } = useTheme();

  const currentTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    setMounted(true);
  }, []);


  if (!mounted) {
    return null;
  }

  const handleClick = () => {
    setTheme(currentTheme === "light" ? "dark" : "light");
  }


  return (
    <div className="flex">
      <button className="btn btn-ghost" onClick={handleClick}>{currentTheme === "light" ? <BiSun className="text-2xl" /> : <BiMoon className="text-2xl" />}</button>
    </div>
  );
};