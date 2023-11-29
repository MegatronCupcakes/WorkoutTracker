window.ModalTools = {
    closeModal: (modalId) => {
        return new Promise((resolve) => {
            try {
                const myModalEl = document.getElementById(modalId);
                const modal = bootstrap.Modal.getInstance(myModalEl)
                modal.hide();
                resolve(true);
            } catch (error) {
                console.error(`ModalTools.closeModal ERROR: ${error.message}`);
                resolve(false);
            }
        });        
    }
}