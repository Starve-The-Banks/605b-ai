"use client";

export default function CheckoutErrorModal({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="checkout-error-backdrop" role="presentation" onClick={onClose}>
      <div
        className="checkout-error-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="checkout-error-title"
        aria-describedby="checkout-error-message"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="checkout-error-icon">!</div>
        <h2 id="checkout-error-title">Checkout could not start</h2>
        <p id="checkout-error-message">{message}</p>
        <button type="button" onClick={onClose} autoFocus>
          Try again
        </button>
      </div>
      <style jsx>{`
        .checkout-error-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(8px);
        }

        .checkout-error-modal {
          width: min(100%, 420px);
          padding: 28px;
          border: 1px solid rgba(255, 107, 53, 0.28);
          border-radius: 18px;
          background: var(--bg-card, #18181b);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
          color: var(--text, #fafafa);
          text-align: center;
        }

        .checkout-error-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          margin-bottom: 16px;
          border-radius: 999px;
          background: rgba(255, 107, 53, 0.14);
          color: var(--orange, #ff6b35);
          font-weight: 800;
        }

        h2 {
          margin: 0 0 10px;
          font-size: 20px;
          font-weight: 700;
        }

        p {
          margin: 0 0 22px;
          color: var(--text-muted, #a1a1aa);
          line-height: 1.5;
        }

        button {
          width: 100%;
          padding: 12px 16px;
          border: 0;
          border-radius: 10px;
          background: var(--orange, #ff6b35);
          color: #09090b;
          font-weight: 700;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
