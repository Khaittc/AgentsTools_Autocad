import React, { useState, useRef, useEffect } from 'react';
import { useSimulator } from '../../state/SimulatorContext.tsx';

export const CommandLine: React.FC = () => {
  const { cmdHistory, cmdPrompt, executeCommand, cancelTool } = useSimulator();
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const commandListRef = useRef<string[]>([]);
  const historyBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of command history
  useEffect(() => {
    historyBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cmdHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (inputVal.trim()) {
        commandListRef.current.push(inputVal);
        executeCommand(inputVal);
      }
      setInputVal('');
      setHistoryIndex(null);
    } else if (e.key === 'Escape') {
      cancelTool();
      setInputVal('');
      setHistoryIndex(null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const list = commandListRef.current;
      if (list.length === 0) return;
      const nextIdx = historyIndex === null ? list.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(list[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const list = commandListRef.current;
      if (historyIndex === null) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx < list.length) {
        setHistoryIndex(nextIdx);
        setInputVal(list[nextIdx]);
      } else {
        setHistoryIndex(null);
        setInputVal('');
      }
    }
  };

  return (
    <div className="cad-command-line">
      {/* History log */}
      <div className="cad-cmd-history">
        {cmdHistory.map((line, idx) => (
          <div key={idx} className="cad-cmd-line">
            {line}
          </div>
        ))}
        <div ref={historyBottomRef} />
      </div>

      {/* Input row */}
      <div className="cad-cmd-input-row">
        <span className="cad-cmd-prompt">{cmdPrompt}</span>
        <input
          type="text"
          className="cad-cmd-input"
          value={inputVal}
          placeholder="Type a command (e.g. HELP, TTCPANEL, S01, S02, FIT, CLEAR)"
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>
    </div>
  );
};
