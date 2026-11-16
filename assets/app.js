(function () {
    const I18N = {
        de: {
            book: "Termin buchen",
            lead: "Behandlung, Tag und Uhrzeit. Dauert eine Minute.",
            service: "Behandlung",
            date: "Datum",
            time: "Uhrzeit",
            name: "Name",
            phone: "Telefon",
            note: "Nachricht",
            notePh: "Farbe, Länge oder Wunsch",
            submit: "Termin anfragen",
            hours: "Mo–Fr 09:00–18:30 · Sa 09:00–16:00 · So zu",
            price: "Preise auf der Instagram-Preisliste",
            place: "8355 Aadorf, Schweiz",
            closed: "Sonntag ist geschlossen.",
            none: "An diesem Tag ist keine Zeit mehr frei.",
            pick: "Bitte zuerst eine Behandlung wählen.",
            missing: "Name und Telefonnummer brauchen wir noch.",
            taken: "Diese Zeit wurde gerade vergeben. Bitte eine andere wählen.",
            invalid: "Bitte prüfe die Angaben.",
            sent: "Anfrage ist drin",
            sentLead: "Der Termin ist für dich reserviert. Zehra bestätigt kurz per Nachricht.",
            another: "Weiteren Termin",
            whenLabel: "Wann"
        },
        en: {
            book: "Book a visit",
            lead: "Service, day and time. It takes a minute.",
            service: "Service",
            date: "Date",
            time: "Time",
            name: "Name",
            phone: "Phone",
            note: "Note",
            notePh: "Colour, length or a wish",
            submit: "Request appointment",
            hours: "Mon–Fri 09:00–18:30 · Sat 09:00–16:00 · Sun closed",
            price: "Prices are on the Instagram price list",
            place: "8355 Aadorf, Switzerland",
            closed: "Sunday is closed.",
            none: "Nothing is free on this day.",
            pick: "Choose a service first.",
            missing: "Name and phone are still needed.",
            taken: "That time was just taken. Please pick another.",
            invalid: "Please check the details.",
            sent: "Request is in",
            sentLead: "This time is held for you. Zehra will confirm with a short message.",
            another: "Book another",
            whenLabel: "When"
        }
    };

    const WEEK = { 1: [9 * 60, 18 * 60 + 30], 2: [9 * 60, 18 * 60 + 30], 3: [9 * 60, 18 * 60 + 30], 4: [9 * 60, 18 * 60 + 30], 5: [9 * 60, 18 * 60 + 30], 6: [9 * 60, 16 * 60], 0: null };
    const STEP = 30;
    const NOTICE = 120;
    const HORIZON = 60;
    const STORE = "zn-pitch-bookings";

    const form = document.getElementById("booking");
    if (!form) return;

    const slotsEl = document.getElementById("slots");
    const noteEl = document.getElementById("slot-note");
    const errorEl = document.getElementById("form-error");
    const dateEl = document.getElementById("date");
    let lang = localStorage.getItem("zn-lang") === "en" ? "en" : "de";

    function t(key) {
        return (I18N[lang] && I18N[lang][key]) || key;
    }

    function pad(n) {
        return String(n).padStart(2, "0");
    }

    function iso(date) {
        return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
    }

    function parseISO(value) {
        const parts = value.split("-").map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function hhmm(total) {
        return pad(Math.floor(total / 60)) + ":" + pad(total % 60);
    }

    function toMinutes(value) {
        const parts = value.split(":").map(Number);
        return parts[0] * 60 + parts[1];
    }

    function readBookings() {
        try {
            const rows = JSON.parse(localStorage.getItem(STORE) || "[]");
            return Array.isArray(rows) ? rows : [];
        } catch (err) {
            return [];
        }
    }

    function saveBooking(row) {
        const rows = readBookings();
        rows.push(row);
        localStorage.setItem(STORE, JSON.stringify(rows));
    }

    function overlaps(date, start, minutes, rows) {
        const end = start + minutes;
        return rows.some(function (row) {
            if (row.date !== date) return false;
            const other = toMinutes(row.time);
            return start < other + row.minutes && end > other;
        });
    }

    function slotsFor(dateValue, minutes) {
        const day = parseISO(dateValue);
        const hours = WEEK[day.getDay()];
        if (!hours) return { closed: true, slots: [] };
        const now = new Date();
        const earliest = new Date(now.getTime() + NOTICE * 60000);
        const slots = [];
        for (let cursor = hours[0]; cursor + minutes <= hours[1]; cursor += STEP) {
            const slot = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(cursor / 60), cursor % 60);
            if (slot < earliest) continue;
            if (!overlaps(dateValue, cursor, minutes, readBookings())) slots.push(hhmm(cursor));
        }
        return { closed: false, slots: slots };
    }

    function formatWhen(dateValue, time) {
        const day = parseISO(dateValue);
        const days = lang === "en"
            ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
            : ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
        const months = lang === "en"
            ? ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
            : ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
        return days[day.getDay()] + ", " + day.getDate() + ". " + months[day.getMonth()] + " " + day.getFullYear() + " · " + time;
    }

    function applyLang() {
        document.documentElement.lang = lang;
        document.querySelectorAll("[data-i18n]").forEach(function (node) {
            const key = node.getAttribute("data-i18n");
            if (I18N[lang][key]) node.textContent = I18N[lang][key];
        });
        document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) {
            node.placeholder = t(node.getAttribute("data-i18n-placeholder"));
        });
        document.querySelectorAll(".service-name, .service-desc").forEach(function (node) {
            node.textContent = node.getAttribute("data-" + lang) || node.textContent;
        });
        document.querySelectorAll(".lang button").forEach(function (button) {
            const on = button.getAttribute("data-lang") === lang;
            button.classList.toggle("is-on", on);
            button.setAttribute("aria-pressed", on ? "true" : "false");
        });
        document.title = t("book") + " · Zehra Nails Aadorf";
    }

    document.querySelectorAll(".lang button").forEach(function (button) {
        button.addEventListener("click", function () {
            lang = button.getAttribute("data-lang") === "en" ? "en" : "de";
            localStorage.setItem("zn-lang", lang);
            applyLang();
            if (selectedService()) loadSlots();
        });
    });

    function selectedService() {
        return document.querySelector('input[name="service"]:checked');
    }

    function showNote(message) {
        noteEl.hidden = !message;
        noteEl.textContent = message || "";
    }

    function showError(message) {
        errorEl.hidden = !message;
        errorEl.textContent = message || "";
    }

    function loadSlots() {
        const service = selectedService();
        slotsEl.innerHTML = "";
        showError("");
        if (!service) {
            showNote(t("pick"));
            return;
        }
        const result = slotsFor(dateEl.value, Number(service.dataset.minutes));
        if (result.closed) {
            showNote(t("closed"));
            return;
        }
        if (result.slots.length === 0) {
            showNote(t("none"));
            return;
        }
        showNote("");
        result.slots.forEach(function (time) {
            const label = document.createElement("label");
            label.className = "slot";
            const input = document.createElement("input");
            input.type = "radio";
            input.name = "time";
            input.value = time;
            input.required = true;
            const span = document.createElement("span");
            span.textContent = time;
            label.appendChild(input);
            label.appendChild(span);
            slotsEl.appendChild(label);
        });
    }

    function showDone(data) {
        document.getElementById("form-panel").hidden = true;
        const done = document.getElementById("done");
        done.hidden = false;
        document.getElementById("done-ref").textContent = data.ref;
        document.getElementById("done-service").textContent = data.service + " · " + data.minutes + " min";
        document.getElementById("done-when").textContent = data.when;
        done.scrollIntoView({ block: "nearest" });
    }

    document.querySelectorAll('input[name="service"]').forEach(function (input) {
        input.addEventListener("change", loadSlots);
    });
    dateEl.addEventListener("change", function () {
        if (selectedService()) loadSlots();
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        showError("");
        const service = selectedService();
        const timeInput = form.querySelector('input[name="time"]:checked');
        if (!service || !timeInput) {
            showError(t("invalid"));
            return;
        }
        const phoneDigits = (form.phone.value || "").replace(/\D+/g, "");
        if ((form.name.value || "").trim().length < 2 || phoneDigits.length < 8) {
            showError(t("missing"));
            return;
        }
        const minutes = Number(service.dataset.minutes);
        const open = slotsFor(dateEl.value, minutes);
        if (open.closed || open.slots.indexOf(timeInput.value) === -1) {
            showError(t("taken"));
            loadSlots();
            return;
        }
        const nameNode = service.parentElement.querySelector(".service-name");
        const ref = "ZN-" + Math.random().toString(16).slice(2, 6).toUpperCase();
        saveBooking({
            date: dateEl.value,
            time: timeInput.value,
            minutes: minutes
        });
        showDone({
            ref: ref,
            service: nameNode.getAttribute("data-" + lang) || nameNode.textContent,
            minutes: minutes,
            when: formatWhen(dateEl.value, timeInput.value)
        });
    });

    document.getElementById("again").addEventListener("click", function () {
        form.reset();
        dateEl.value = dateEl.defaultValue;
        slotsEl.innerHTML = "";
        showNote(t("pick"));
        showError("");
        document.getElementById("done").hidden = true;
        document.getElementById("form-panel").hidden = false;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const max = new Date(today);
    max.setDate(max.getDate() + HORIZON);
    let start = new Date(today);
    for (let i = 0; i < 7 && !WEEK[start.getDay()]; i += 1) start.setDate(start.getDate() + 1);
    dateEl.min = iso(today);
    dateEl.max = iso(max);
    dateEl.value = iso(start);
    dateEl.defaultValue = dateEl.value;

    applyLang();
    showNote(t("pick"));
})();
