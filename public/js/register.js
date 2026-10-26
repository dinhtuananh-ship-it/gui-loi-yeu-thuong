const buttons = document.querySelectorAll(".register-switch button");
for (const button of buttons) {
    button.addEventListener("click", () => {
        const creating = button.dataset.mode === "create";
        document.querySelector("#register-mode").value = button.dataset.mode;
        document.querySelector("#room-label").textContent = creating ? "ĐẶT MÃ PHÒNG CỦA BẠN" : "MÃ PHÒNG NGƯỜI ẤY ĐÃ GỬI";
        document.querySelector("#room-help").textContent = creating
            ? "Chọn mã gồm 3-32 chữ cái, số hoặc dấu gạch ngang. Chỉ thêm một người có thể tham gia bằng mã này."
            : "Nhập mã phòng mà người ấy đã tạo và chia sẻ với bạn.";
        document.querySelector("#register-submit").textContent = creating ? "Tạo tài khoản và phòng ↗" : "Tham gia phòng ↗";
        for (const option of buttons) {
            const active = option === button;
            option.classList.toggle("selected", active);
            option.setAttribute("aria-pressed", String(active));
        }
    });
}
