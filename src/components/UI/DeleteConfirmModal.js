import React from 'react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 shadow-lg">
                <h2 className="text-lg font-bold mb-4">Confirm Deletion</h2>
                <p className="mb-4">Are you sure you want to delete this recipe?</p>
                <div className="flex justify-end">
                    <button 
                        className="mr-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" 
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button 
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" 
                        onClick={onConfirm}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;