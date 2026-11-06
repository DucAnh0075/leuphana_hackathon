"use client";

import { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styles from "./Planning.module.css";

type Props = {
  changingPerson: boolean;
  returnFocus: HTMLElement | null;
  onCancel: () => void;
  onConfirm: () => void;
  onConfirmedFocus: () => void;
};

export default function PlanningConfirmation({ changingPerson, returnFocus, onCancel, onConfirm, onConfirmedFocus }: Props) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  const confirmed = useRef(false);
  return <Dialog.Root open onOpenChange={open => { if (!open) onCancel(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.confirmationOverlay}/>
      <Dialog.Content
        lang="en"
        className={styles.confirmation}
        onOpenAutoFocus={event => { event.preventDefault(); cancelButton.current?.focus(); }}
        onCloseAutoFocus={event => {
          event.preventDefault();
          if (confirmed.current) onConfirmedFocus();
          else if (returnFocus?.isConnected) returnFocus.focus();
        }}
      >
        <Dialog.Title>{changingPerson ? "Change who this plan is for?" : "Start a new plan?"}</Dialog.Title>
        <Dialog.Description>
          {changingPerson
            ? "The previous person's answers and review will be cleared. Your document choices will stay."
            : "This clears the planning answers in this tab. Existing documents and sharing receipts stay as they are."}
        </Dialog.Description>
        <div className={styles.actions}>
          <button ref={cancelButton} type="button" className={styles.secondaryButton} onClick={onCancel}>{changingPerson ? "Keep current plan" : "Keep my plan"}</button>
          <button type="button" className={styles.primaryButton} onClick={() => { confirmed.current = true; onConfirm(); }}>{changingPerson ? "Change person" : "Start new plan"}</button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
