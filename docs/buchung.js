const baseUrl = location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://diestimmedesmoments.onrender.com';

const datePicker = document.getElementById('datePicker');
const slotsDiv = document.getElementById('slots');

// Setzt das Minimum auf heute
datePicker.min = new Date().toISOString().split('T')[0];

datePicker.addEventListener('change', loadSlotsForDate);

async function loadSlotsForDate() {
  slotsDiv.innerHTML = 'Lade freie Termine...';
  const selectedDate = new Date(datePicker.value);
  if (isNaN(selectedDate)) {
    slotsDiv.textContent = 'Bitte wähle ein gültiges Datum.';
    return;
  }

  const res = await fetch(`${baseUrl}/api/slots`);
  const data = await res.json();
  const busy = data.busy.map(b => ({
    start: new Date(b.start),
    end: new Date(b.end)
  }));

  // Arbeitszeit: 08:00–18:00 Uhr, 1h Blöcke
  const slots = [];
  for (let hour = 8; hour < 18; hour++) {
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1);

    const now = new Date();
    const isBusy = busy.some(b => slotStart < b.end && slotEnd > b.start);
    if (!isBusy && slotStart > now && selectedDate.getDay() > 0 && selectedDate.getDay() < 6) {
      slots.push({ start: slotStart, end: slotEnd });
    }
  }

  slotsDiv.innerHTML = '';
  if (slots.length === 0) {
    slotsDiv.textContent = 'Keine freien Termine an diesem Tag.';
    return;
  }

  const list = document.createElement('div');
  list.className = 'slot-day';
  slots.forEach(slot => {
    const btn = document.createElement('button');
    btn.textContent = `${slot.start.getHours()}:00 – ${slot.end.getHours()}:00 Uhr`;
    btn.onclick = async () => {
      const name = prompt('Dein Name:');
      const email = prompt('Deine E-Mail:');
      if (!name || !email) return alert('Name und E-Mail sind erforderlich!');

      try {
        const res = await fetch(`${baseUrl}/api/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, email,
            start: slot.start.toISOString(),
            end: slot.end.toISOString()
          })
        });
        const result = await res.json();
        if (result.success) alert('Termin erfolgreich gebucht!');
        else alert('Fehler: ' + (result.error || 'Unbekannter Fehler'));
        loadSlotsForDate();
      } catch (e) {
        alert('Fehler beim Buchen: ' + e.message);
      }
    };
    list.appendChild(btn);
  });

  slotsDiv.appendChild(list);
}
