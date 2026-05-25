import Modal from "../Modal/Modal";

type Props = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  backDrop: () => void;
};

export function UnsavedChangesModal({
  open,
  onConfirm,
  onCancel,
  backDrop,
}: Readonly<Props>) {
  if (!open) return null;

  return (
    <Modal
      isOpen={open}
      title="Unsaved changes"
      submitText="Save and Exit"
      cancelText="Leave"
      onClose={onCancel}
      backDrop={backDrop}
      onSubmit={onConfirm}
      description="You have unsaved changes. Are you sure you want to leave?"
    />
  );
}
