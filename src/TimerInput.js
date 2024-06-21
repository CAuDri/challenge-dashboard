import React from 'react';

const TimerInput = ({ value, setValue, showButtons = true }) => {

  return (
    <div>
      {showButtons && <button onClick={() => setValue(value + 1)}>+</button>}
      <p>{value}</p>
      {showButtons && <button onClick={() => setValue(value - 1)}>-</button>}
    </div>
  );
};

export default TimerInput;
