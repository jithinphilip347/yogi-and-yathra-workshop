'use client';

import { useLayoutEffect, useState } from 'react';

export default function useExperienceHeaderOffset() {
  const [style, setStyle] = useState({});
  useLayoutEffect(() => {
    const nav = document.getElementById('Nav');
    const subNav = document.getElementById('SubNav');
    const measure = () => {
      const navBottom = nav?.getBoundingClientRect().bottom || 0;
      const subRect = subNav?.getBoundingClientRect();
      const visible = subNav && getComputedStyle(subNav).display !== 'none';
      setStyle({
        '--experience-header-bottom': `${Math.max(navBottom, visible ? subRect.bottom : 0)}px`,
        '--experience-subnav-height': `${visible ? subRect.height : 0}px`,
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (nav) observer.observe(nav);
    if (subNav) observer.observe(subNav);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  return style;
}
