import React from "react";

export default function G5Icon() {
  return (
    <span styles="display: flex; justify-content: center">
      <img src="/g5.png" height="24px" />
      <style jsx>{`
        span {
          display: block;
          width: 24px;
          height: 24px;
          position: relative;
          left: 50%;
          top: 50%;
          margin-left: -12px;
          margin-top: -12px;
        }
      `}</style>
    </span>
  );
}
