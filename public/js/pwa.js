if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(error => console.warn("PWA offline unavailable:", error));
    });
}

let installPrompt;
window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    const button = document.querySelector("#install-button");
    if (button) button.hidden = false;
});

document.querySelector("#install-button")?.addEventListener("click", async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    installPrompt = null;
    document.querySelector("#install-button").hidden = true;
});
