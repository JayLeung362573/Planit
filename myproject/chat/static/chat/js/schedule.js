document.querySelectorAll('.card-time').forEach(el => {
  const [hStr, mStr] = el.textContent.trim().split(':');
  let h = parseInt(hStr, 10);
  const suffix = h < 12 ? 'AM' : 'PM';
  h = h % 12 || 12;
  el.textContent = mStr === '00' ? `${h}${suffix}` : `${h}:${mStr}${suffix}`;
});

document.querySelectorAll('.card-weather').forEach(el => {
  el.textContent = el.textContent
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
});