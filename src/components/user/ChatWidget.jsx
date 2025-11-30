import { useState } from "react";
import ChatBox from "./ChatBox";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={styles.button}
        >
          💬
        </button>
      )}

      {open && <ChatBox close={() => setOpen(false)} />}
    </>
  );
}

const styles = {
  button: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    fontSize: "24px",
    cursor: "pointer"
  }
};
