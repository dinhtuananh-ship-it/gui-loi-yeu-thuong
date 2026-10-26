const dialog = document.querySelector("#memory-dialog");
document.querySelectorAll(".open-memory").forEach(button => {
    button.addEventListener("click", () => {
        const template = document.getElementById(button.dataset.memoryId);
        document.querySelector("#dialog-body").replaceChildren(template.content.cloneNode(true));
        dialog.showModal();
    });
});
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
