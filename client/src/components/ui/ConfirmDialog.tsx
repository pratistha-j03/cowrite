import { Modal } from "./Modal";
import { Button } from "./Button";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, busy, onConfirm, onCancel }: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" loading={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}