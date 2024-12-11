export const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Delete Confirmation',
    message = 'Are you sure you want to delete this item? This action cannot be undone.'
  }) => {
    return (
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        maxWidth="max-w-md"
      >
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </FormModal>
    );
  };