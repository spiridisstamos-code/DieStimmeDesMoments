const baseUrl = location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://diestimmedesmoments.onrender.com';

let currentMonthOffset = 0;

document.getElementById('prevMonth').onclick = () => {
  currentMonthOffset--;
  loadSlots();
};

document.getElementById('nextMonth').onclick = () => {
  currentMonthOffset++;
  loadSlots();
};

async function loadSlots() {
  const res = await fetch(`${baseUrl}/api/slots`);
  const data = await res.json();

  const busy = data.busy.map(b => ({
    start: new Date(b.start),
    end: new Date(b.end)
  }));

  const now = new Date();
  const targetMonth = new Date();
  targetMonth.setMonth(now.getMonth() + currentMonthOffset);
  targetMonth.setDate(1);

  const endOfMonth = new Date(targetMonth);
  endOfMonth.setMonth(targetMonth.getMonth() + 1);
  endOfMonth.setDate(0);

  document.getElementById('monthLabel').textContent = targetMonth.toLocaleString('de-DE', { month: 'long', year: 'numeric' });

  const slots = [];
  const current = new Date(targetMonth);
  current.setHours(0, 0, 0, 0);

  while (current <= endOfMonth) {
    const day = current.getDay();
    if (day > 0 && day < 6) {
      for (let hour = 8; hour < 18; hour++) {
        const slotStart = new Date(current);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1);

        const isBusy = busy.some(b => slotStart < b.end && slotEnd > b.start);
        if (!isBusy && slotStart > now) {
          slots.push({ start: slotStart, end: slotEnd });
        }
      }
    }
    current.setDate(current.getDate() + 1);
  }

  const container = document.getElementById('slots');
  container.innerHTML = '';

  if (slots.length === 0) {
    container.textContent = 'Keine freien Termine verfügbar.';
    return;
  }

  const grouped = {};
  slots.forEach(slot => {
    const dateKey = slot.start.toLocaleDateString('de-DE');
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(slot);
  });

  for (const date in grouped) {
    const group = document.createElement('div');
    const headline = document.createElement('h3');
    headline.textContent = date;
    group.appendChild(headline);

    grouped[date].forEach(slot => {
      const btn = document.createElement('button');
      btn.textContent = `${slot.start.getHours()}:00 – ${slot.end.getHours()}:00`;
      btn.onclick = async () => {
        const name = prompt('Dein Name:');
        const email = prompt('Deine E-Mail:');
        if (!name || !email) {
          alert('Name und E-Mail sind erforderlich!');
          return;
        }
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
          loadSlots();
        } catch (e) {
          alert('Fehler beim Buchen: ' + e.message);
        }
      };
      group.appendChild(btn);
    });

    container.appendChild(group);
  }
}

loadSlots();
