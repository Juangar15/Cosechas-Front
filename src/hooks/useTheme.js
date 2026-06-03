import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [modoOscuro, setModoOscuro] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (modoOscuro) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [modoOscuro]);

  const toggleTheme = () => setModoOscuro(!modoOscuro);

  return { modoOscuro, toggleTheme };
};
