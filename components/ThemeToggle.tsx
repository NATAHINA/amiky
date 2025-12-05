"use client";

import { ActionIcon, useMantineColorScheme } from "@mantine/core";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <ActionIcon size="lg" variant="outline">
        <Sun size={20} />
      </ActionIcon>
    );
  }

  const dark = colorScheme === "dark";

  return (
    <ActionIcon
      size="lg"
      variant="outline"
      onClick={() => setColorScheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </ActionIcon>
  );
}
