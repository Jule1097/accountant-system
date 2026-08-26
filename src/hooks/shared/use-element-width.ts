"use client";

import { useCallback, useEffect, useState } from "react";

export function useElementWidth<T extends HTMLElement>(): [(node: T | null) => void, number] {
  const [node, setNode] = useState<T | null>(null);
  const [width, setWidth] = useState(0);

  const handleNodeChange = useCallback((nextNode: T | null): void => {
    setNode(nextNode);
  }, []);

  useEffect(() => {
    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width || 0;
      setWidth(nextWidth);
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node]);

  return [handleNodeChange, width];
}
