import Swal from 'sweetalert2'

const toastDefaults = {
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timerProgressBar: true,
}

/** Non-blocking success notification */
export function notifySuccess(title, text = '') {
  return Swal.fire({
    ...toastDefaults,
    icon: 'success',
    title,
    text: text || undefined,
    timer: 3200,
  })
}

/** Non-blocking error notification */
export function notifyError(title, text = '') {
  return Swal.fire({
    ...toastDefaults,
    icon: 'error',
    title,
    text: text || undefined,
    timer: 4500,
  })
}

/**
 * Modal confirmation for destructive actions.
 * Pass either `html` or `text` for the body (html takes precedence).
 */
export async function confirmDanger({ title, html, text, confirmText = 'Confirm' }) {
  const result = await Swal.fire({
    title,
    html,
    text: html ? undefined : text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
  })
  return result.isConfirmed
}
