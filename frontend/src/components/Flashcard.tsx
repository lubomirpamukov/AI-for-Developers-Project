import { useId, useState } from "react";
import type { Flashcard as FlashcardModel } from "@quizmaker/shared";
import styles from "./Flashcard.module.css";

interface FlashcardProps {
  card: FlashcardModel;
  index: number;
}

export function Flashcard({ card, index }: FlashcardProps) {
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const questionId = useId();
  const answerId = useId();
  const cardNumber = index + 1;
  const activeLabel = isAnswerVisible ? card.answer : card.question;

  function handleFlip() {
    setIsAnswerVisible((currentValue) => !currentValue);
  }

  return (
    <button
      aria-label={activeLabel}
      aria-pressed={isAnswerVisible}
      className={`${styles.card} ${isAnswerVisible ? styles.isFlipped : ""}`}
      onClick={handleFlip}
      type="button"
    >
      <span aria-hidden={isAnswerVisible} className={`${styles.face} ${styles.frontFace}`}>
        <span className={styles.cardHeader}>
          <span className={styles.cardNumber}>{String(cardNumber).padStart(2, "0")}</span>
          <span className={styles.sideLabel}>Question</span>
        </span>
        <span className={styles.cardBody} id={questionId}>
          {card.question}
        </span>
        <span className={styles.cardHint}>Tap to reveal the answer</span>
      </span>

      <span aria-hidden={!isAnswerVisible} className={`${styles.face} ${styles.backFace}`}>
        <span className={styles.cardHeader}>
          <span className={styles.cardNumber}>{String(cardNumber).padStart(2, "0")}</span>
          <span className={styles.sideLabel}>Answer</span>
        </span>
        <span className={styles.cardBody} id={answerId}>
          {card.answer}
        </span>
        <span className={styles.cardHint}>Tap to return to the question</span>
      </span>
    </button>
  );
}
