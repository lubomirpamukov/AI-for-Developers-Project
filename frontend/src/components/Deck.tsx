import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ApiProvider, FlashcardDeck } from "@quizmaker/shared";
import { Flashcard } from "./Flashcard.js";
import styles from "./Deck.module.css";

interface DeckProps {
  deck: FlashcardDeck;
  provider: ApiProvider;
}

const closeAnimationMs = 220;

export function Deck({ deck, provider }: DeckProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const readerBackButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const cardCountLabel = deck.cards.length === 1 ? "card" : "cards";
  const modalTitleId = `${deck.deckId}-deck-title`;
  const selectedCardEntry = selectedCardId
    ? deck.cards
        .map((card, index) => ({ card, index }))
        .find((entry) => entry.card.id === selectedCardId)
    : undefined;

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      return undefined;
    }

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDeck();
        return;
      }

      if (event.key === "Tab") {
        trapModalFocus(event);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (selectedCardEntry) {
      readerBackButtonRef.current?.focus();
    }
  }, [selectedCardEntry]);

  function openDeck() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setIsClosing(false);
    setIsModalOpen(true);
  }

  function closeDeck() {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setIsModalOpen(false);
      setIsClosing(false);
      setSelectedCardId(null);
      closeTimerRef.current = null;
      openButtonRef.current?.focus();
    }, closeAnimationMs);
  }

  function handleOverlayMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      closeDeck();
    }
  }

  function trapModalFocus(event: KeyboardEvent) {
    const modalElement = modalRef.current;

    if (!modalElement) {
      return;
    }

    const focusableElements = Array.from(
      modalElement.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  const modal = isModalOpen ? (
    <div
      aria-labelledby={modalTitleId}
      aria-modal="true"
      className={`${styles.overlay} ${isClosing ? styles.isClosing : ""}`}
      data-testid="deck-modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      role="dialog"
    >
      <div className={styles.modal} ref={modalRef}>
        <header className={styles.modalHeader}>
          <div>
            <span className={styles.modalKicker}>{formatProviderName(provider)}</span>
            <h2 id={modalTitleId}>{deck.topic}</h2>
            <p>
              {selectedCardEntry
                ? "Reading one card. Tap the enlarged card to reveal the answer."
                : `${deck.cards.length} ${deck.difficulty} ${cardCountLabel}. Choose a card to enlarge it.`}
            </p>
          </div>
          <button
            aria-label="Close flashcard deck"
            className={styles.closeButton}
            onClick={closeDeck}
            ref={closeButtonRef}
            type="button"
          >
            <span aria-hidden="true">x</span>
          </button>
        </header>

        {selectedCardEntry ? (
          <div className={styles.readerStage} data-testid="deck-card-reader">
            <button
              className={styles.readerBackButton}
              onClick={() => setSelectedCardId(null)}
              ref={readerBackButtonRef}
              type="button"
            >
              Back to deck
            </button>
            <Flashcard
              card={selectedCardEntry.card}
              index={selectedCardEntry.index}
              key={selectedCardEntry.card.id}
              variant="reader"
            />
          </div>
        ) : (
          <div className={styles.spread} data-testid="deck-card-spread">
            {deck.cards.map((card, index) => (
              <Flashcard
                card={card}
                index={index}
                key={card.id}
                onOpen={() => setSelectedCardId(card.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className={styles.deckRoot}>
      <button
        aria-haspopup="dialog"
        aria-label={`Open ${deck.topic} flashcard deck`}
        className={styles.deckButton}
        onClick={openDeck}
        ref={openButtonRef}
        type="button"
      >
        <span className={styles.deckMeta}>
          {formatProviderName(provider)} / {deck.difficulty} / {deck.cards.length} {cardCountLabel}
        </span>
        <span className={styles.deckTitle}>{deck.topic}</span>
        <span className={styles.deckPreviewQuestion}>
          {deck.cards[0]?.question ?? "Open the generated deck"}
        </span>
        <span className={styles.deckAction}>Open deck</span>
      </button>

      {modal ? createPortal(modal, document.body) : null}
    </div>
  );
}

function formatProviderName(provider: ApiProvider) {
  return provider === "openai" ? "OpenAI" : "Gemini";
}
