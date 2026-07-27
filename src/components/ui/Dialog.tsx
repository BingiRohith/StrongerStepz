import type { ReactNode } from "react";
import { Modal, type ModalProps } from "@/components/ui/Modal";

export interface DialogProps extends Omit<ModalProps, "children" | "glass"> {
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
}

/**
 * Structured dialog for confirmations and short forms — a title, optional
 * description, optional body, and a footer for actions. Built on `Modal`.
 */
export function Dialog({ title, description, children, footer, ...modalProps }: DialogProps) {
  return (
    <Modal {...modalProps} glass={false}>
      <h2 className="mb-2 font-heading text-2xl text-primary-dark">{title}</h2>
      {description && <p className="mb-6 text-ink-muted">{description}</p>}
      {children}
      {footer && <div className="mt-8 flex justify-end gap-3">{footer}</div>}
    </Modal>
  );
}
