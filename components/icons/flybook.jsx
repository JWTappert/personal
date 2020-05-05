import React from "react";

export default function FlybookIcon() {
  return (
    <span className="flybook">
      <img src="/flybook.png" width="35px" />
      <style jsx>{`
        .flybook {
          display: block;
          width: 24px;
          height: 24px;
          position: relative;
          left: 30%;
          top: 50%;
          margin-left: -12px;
          margin-top: -12px;
        }
      `}</style>
    </span>
  );
}
