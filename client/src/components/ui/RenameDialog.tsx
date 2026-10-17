import { useState, type FormEvent } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Field } from "../Field";

interface Props {
  open: boolean;
  currentTitle: string;
  busy?: boolean;
  onSubmit: (title: string) => void;
  onCancel: () => void;
}

function RenameForm({ currentTitle, busy, onSubmit, onCancel }: Omit<Props, "open">) {
  const [title, setTitle] = useState(currentTitle);

  function submit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t || t === currentTitle) return onCancel();
    onSubmit(t);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field
        label="Title"
        autoFocus
        required
        maxLength={200}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={busy}>
          Save
        </Button>
      </div>
    </form>
  );
}

export function RenameDialog(props: Props) {
  const { open, ...rest } = props;
  return (
    <Modal open={open} onClose={props.onCancel} title="Rename document">
      {open && <RenameForm {...rest} />}
    </Modal>
  );
}